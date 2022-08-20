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
    async load(id) {
      const importAsIdAsUrl = id.replace(/\?type=(.*)/, '');
      const extension = path.extname(importAsIdAsUrl);

      // TODO should we do JS files too, or let Rollup handle it?
      if (extension !== '.js') {

        for (const plugin of resourcePlugins) {
          if (await plugin.shouldServe(importAsIdAsUrl)) {
            const body = (await plugin.serve(importAsIdAsUrl)).body;
            const contents = await resourcePlugins.reduce(async (body, resource) => {
              const headers = {
                request: {
                  originalUrl: id
                },
                response: {
                  'content-type': resource.contentType
                }
              };
              const shouldIntercept = await resource.shouldIntercept(importAsIdAsUrl, body, headers);

              return shouldIntercept
                ? (await resource.intercept(importAsIdAsUrl, body, headers)).body
                : Promise.resolve(body);
            }, Promise.resolve(body));

            return contents;
          }
        }
      }
    }
  };
}

function greenwoodSyncPageResourceBundlesPlugin(compilation) {
  return {
    name: 'greenwood-sync-page-resource-bundles-plugin',
    writeBundle(outputOptions, bundles) {
      const { outputDir } = compilation.context;
      const resources = compilation.resources;

      for (const resourceIdx in resources) {
        for (const bundle in bundles) {
          if (resources[resourceIdx].sourcePathURL.pathname === bundles[bundle].facadeModuleId) {
            const { fileName } = bundles[bundle];
            const { rawAttributes, contents } = resources[resourceIdx];
            const noop = rawAttributes.indexOf('data-gwd-opt="none"') >= 0 || compilation.config.optimization === 'none';
            const outputPath = path.join(outputDir, fileName);

            if (noop) {
              fs.writeFileSync(outputPath, contents);
            } else {
              compilation.resources[resourceIdx].optimizedFileName = fileName;
              compilation.resources[resourceIdx].optimizedFileContents = fs.readFileSync(outputPath, 'utf-8');
            }
          }
        }
      }
    }
  };
}

const getRollupConfig = async (compilation) => {
  const { outputDir } = compilation.context;
  const input = compilation.resources
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