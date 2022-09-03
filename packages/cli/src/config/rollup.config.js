import fs from 'fs';
import path from 'path';
import { terser } from 'rollup-plugin-terser';

function greenwoodResourceLoader (compilation) {
  const resourcePlugins = compilation.config.plugins.filter((plugin) => {
    return plugin.type === 'resource';
  }).map((plugin) => {
    return plugin.provider(compilation);
  });

  return {
    name: 'greenwood-resource-loader',
    resolveId(id) {
      const { userWorkspace } = compilation.context;

      if ((id.indexOf('./') === 0 || id.indexOf('/') === 0) && fs.existsSync(path.join(userWorkspace, id))) {
        return path.join(userWorkspace, id.replace(/\?type=(.*)/, ''));
      }

      return null;
    },
    async load(id) {
      const importAsIdAsUrl = id.replace(/\?type=(.*)/, '');
      const extension = path.extname(importAsIdAsUrl);

      // TODO should we do JS files too, or let Rollup handle it?
      // If Greenwood handled it, this would support Import CommonJS plugin for free
      if (extension !== '.js') {
        let contents;

        for (const plugin of resourcePlugins) {
          const headers = {
            request: {
              originalUrl: id
            },
            response: {
              'content-type': plugin.contentType
            }
          };

          contents = await plugin.shouldServe(importAsIdAsUrl)
            ? (await plugin.serve(importAsIdAsUrl)).body
            : contents;

          if (await plugin.shouldIntercept(importAsIdAsUrl, contents, headers)) {
            contents = (await plugin.intercept(importAsIdAsUrl, contents, headers)).body;
          }
        }

        return contents;
      }
    }
  };
}

function greenwoodSyncPageResourceBundlesPlugin(compilation) {
  return {
    name: 'greenwood-sync-page-resource-bundles-plugin',
    writeBundle(outputOptions, bundles) {
      const { outputDir } = compilation.context;

      for (const resource of compilation.resources.values()) {
        const resourceKey = resource.sourcePathURL.pathname;
        for (const bundle in bundles) {
          if (resourceKey === bundles[bundle].facadeModuleId) {
            const { fileName } = bundles[bundle];
            const { rawAttributes, contents } = resource;
            const noop = rawAttributes && rawAttributes.indexOf('data-gwd-opt="none"') >= 0 || compilation.config.optimization === 'none';
            const outputPath = path.join(outputDir, fileName);

            compilation.resources.set(resourceKey, {
              ...compilation.resources.get(resourceKey),
              optimizedFileName: fileName,
              optimizedFileContents: fs.readFileSync(outputPath, 'utf-8'),
              contents: contents.replace(/\.\//g, '/')
            });

            if (noop) {
              fs.writeFileSync(outputPath, contents);
            }
          }
        }
      }
    }
  };
}

const getRollupConfig = async (compilation) => {
  const { outputDir } = compilation.context;
  const input = [...compilation.resources.values()]
    .filter(resource => resource.type === 'script')
    .map(resource => resource.sourcePathURL.pathname);
  const customRollupPlugins = compilation.config.plugins.filter(plugin => {
    return plugin.type === 'rollup';
  }).map(plugin => {
    return plugin.provider(compilation);
  }).flat();

  return [{
    input,
    output: { 
      dir: outputDir,
      entryFileNames: '[name].[hash].js',
      chunkFileNames: '[name].[hash].js',
      sourcemap: true
    },
    // TODO will we need _any_ other Rollup plugins from greenwood plugins?
    // commonjs, nodeResolve, etc
    plugins: [
      greenwoodResourceLoader(compilation),
      greenwoodSyncPageResourceBundlesPlugin(compilation),
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