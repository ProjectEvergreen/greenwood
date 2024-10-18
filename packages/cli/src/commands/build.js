import { bundleCompilation } from '../lifecycles/bundle.js';
import { checkResourceExists } from '../lib/resource-utils.js';
import { copyAssets } from '../lifecycles/copy.js';
import { getDevServer } from '../lifecycles/serve.js';
import fs from 'fs/promises';
import { preRenderCompilationWorker, preRenderCompilationCustom, staticRenderCompilation } from '../lifecycles/prerender.js';
import { ServerInterface } from '../lib/server-interface.js';

const runProductionBuild = async (compilation) => {

  return new Promise(async (resolve, reject) => {

    try {
      const { prerender, activeContent, plugins } = compilation.config;
      const outputDir = compilation.context.outputDir;
      const prerenderPlugin = compilation.config.plugins.find(plugin => plugin.type === 'renderer')
        ? compilation.config.plugins.find(plugin => plugin.type === 'renderer').provider(compilation)
        : {};
      const adapterPlugin = compilation.config.plugins.find(plugin => plugin.type === 'adapter')
        ? compilation.config.plugins.find(plugin => plugin.type === 'adapter').provider(compilation)
        : null;
      const shouldPrerender = prerender || prerenderPlugin.prerender;

      if (!await checkResourceExists(outputDir)) {
        await fs.mkdir(outputDir, {
          recursive: true
        });
      }

      if (shouldPrerender || (activeContent && shouldPrerender)) {
        // start any of the user's server plugins if needed
        const servers = [...compilation.config.plugins.filter((plugin) => {
          return plugin.type === 'server' && !plugin.isGreenwoodDefaultPlugin;
        }).map((plugin) => {
          const provider = plugin.provider(compilation);

          if (!(provider instanceof ServerInterface)) {
            console.warn(`WARNING: ${plugin.name}'s provider is not an instance of ServerInterface.`);
          }

          return provider;
        })];

        if (activeContent) {
          (await getDevServer({
            ...compilation,
            // prune for the content as data plugin and start the dev server with only that plugin enabled
            plugins: [plugins.find(plugin => plugin.name === 'plugin-active-content')]
          })).listen(compilation.config.devServer.port, () => {
            console.info('Initializing active content...');
          });
        }

        await Promise.all(servers.map(async (server) => {
          await server.start();

          return Promise.resolve(server);
        }));

        if (prerenderPlugin.executeModuleUrl) {
          await preRenderCompilationWorker(compilation, prerenderPlugin);
        } else {
          await preRenderCompilationCustom(compilation, prerenderPlugin);
        }
      } else {
        await staticRenderCompilation(compilation);
      }

      console.info('success, done generating all pages!');

      await bundleCompilation(compilation);
      await copyAssets(compilation);

      if (adapterPlugin) {
        await adapterPlugin();
      }

      resolve();
    } catch (err) {
      reject(err);
    }
  });

};

export { runProductionBuild };