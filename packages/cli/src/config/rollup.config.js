import fs from 'fs';
import path from 'path';
import { terser } from 'rollup-plugin-terser';

function greenwoodWorkspaceResolver (compilation) {
  const resourcePlugins = compilation.config.plugins.filter((plugin) => {
    return plugin.type === 'resource';
  }).map((plugin) => {
    return plugin.provider(compilation);
  });

  return {
    name: 'greenwood-workspace-resolver',
    async resolveId(source) {
      // assumes relative paths are coming from the user's workspace
      if (source.indexOf('.') === 0) {
        const workspacePath = await resourcePlugins.reduce(async (responsePromise, resource) => {
          const response = await responsePromise;
          const resourceShouldResolveUrl = await resource.shouldResolve(response);
          return resourceShouldResolveUrl
            ? resource.resolve(response)
            : Promise.resolve(response);
        }, Promise.resolve(source.replace(/\.\.\//g, '')));

        return workspacePath;
      }

      // TODO handle inline script / style bundling ?
      // if (source.indexOf(`-${tokenSuffix}`) > 0 && fs.existsSync(path.join(scratchDir, source))) {
      //   return source.replace(source, path.join(scratchDir, source));
      // }

      return null;
    },
    // re-use resource plugins to handle custom resource types like .ts, .gql, etc
    async load(id) {
      const extension = path.extname(id);

      // TODO should we do JS files too, or let Rollup handle it?
      if (extension !== '.js') {

        for (const plugin of resourcePlugins) {
          if (await plugin.shouldServe(id)) {
            const body = (await plugin.serve(id)).body;
            const contents = await resourcePlugins.reduce(async (body, resource) => {
              const headers = {
                request: {
                  originalUrl: `${id}?type=${extension.replace('.', '')}`
                },
                response: {
                  'content-type': resource.contentType
                }
              };
              const shouldIntercept = await resource.shouldIntercept(id, body, headers);

              return shouldIntercept
                ? (await resource.intercept(id, body, headers)).body
                : Promise.resolve(body);
            }, Promise.resolve(body));

            return contents;
          }
        }
      }
    }
  };
}

function greenwoodSyncPageResourcesPlugin(compilation) {
  return {
    name: 'greenwood-sync-page-resource-paths',
    writeBundle(outputOptions, bundles) {
      const { outputDir } = compilation.context;
      const resources = compilation.resources;

      for (const resourceIdx in resources) {
        for (const bundle in bundles) {
          if (resources[resourceIdx].sourcePathURL.pathname === bundles[bundle].facadeModuleId) {
            const { fileName } = bundles[bundle];
            compilation.resources[resourceIdx].optimizedFileName = fileName;

            if (compilation.resources[resourceIdx].contents) {
              compilation.resources[resourceIdx].optimizedFileContents = fs.readFileSync(path.join(outputDir, fileName), 'utf-8');
            }
          }
        }
      }
    }
  };
}

const getRollupConfig = async (compilation) => {
  const { outputDir } = compilation.context;
  const customRollupPlugins = compilation.config.plugins.filter(plugin => {
    return plugin.type === 'rollup';
  }).map(plugin => {
    return plugin.provider(compilation);
  }).flat();

  return [{
    input: compilation.resources
      .filter(resource => resource.type === 'script')
      .map(resource => resource.sourcePathURL.pathname),
    output: { 
      dir: outputDir,
      entryFileNames: '[name].[hash].js',
      chunkFileNames: '[name].[hash].js',
      sourcemap: true
    },
    // TODO will we need _any_ other Rollup plugins from greenwood plugins?
    // commonjs, nodeResolve, etc
    plugins: [
      greenwoodSyncPageResourcesPlugin(compilation),
      greenwoodWorkspaceResolver(compilation),
      ...customRollupPlugins,
      terser()
    ],
    context: 'window',
    onwarn: (errorObj) => {
      const { code, message } = errorObj;

      switch (code) {

        case 'EMPTY_BUNDLE':
          // since we use .html files as entry points
          // we "ignore" them as bundles (see greenwoodHtmlPlugin#load hook)
          // but don't want the logs to be noisy, so this suppresses those warnings
          break;
        case 'UNRESOLVED_IMPORT':
          // this could be a legit warning for users, but...
          if (process.env.__GWD_ROLLUP_MODE__ === 'strict') { // eslint-disable-line no-underscore-dangle
            // if we see it happening in our tests / website build
            // treat it as an error for us since it usually is...
            // https://github.com/ProjectEvergreen/greenwood/issues/620
            throw new Error(message);
          } else {
            // we should still log it so the user knows at least
            console.debug(message);
          }
          break;
        default:
          // otherwise, log all warnings from rollup
          console.debug(message);

      }
    }
  }];
};

export { getRollupConfig };