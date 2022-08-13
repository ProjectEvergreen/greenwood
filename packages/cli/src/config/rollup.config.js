import fs from 'fs';
import path from 'path';
import { terser } from 'rollup-plugin-terser';

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
    // TODO will we need Rollup plugins from greenwood plugins?
    plugins: [
      terser(),
      greenwoodSyncPageResourcesPlugin(compilation)
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