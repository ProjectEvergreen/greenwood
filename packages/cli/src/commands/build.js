import { bundleCompilation } from '../lifecycles/bundle.js';
import { checkResourceExists } from '../lib/resource-utils.js';
import { copyAssets } from '../lifecycles/copy.js';
import fs from 'fs/promises';
import { preRenderCompilationWorker, preRenderCompilationCustom, staticRenderCompilation } from '../lifecycles/prerender.js';
import { ServerInterface } from '../lib/server-interface.js';

const runProductionBuild = async (compilation) => {

  return new Promise(async (resolve, reject) => {

    try {
      const { prerender } = compilation.config;
      const outputDir = compilation.context.outputDir;
      const prerenderPlugin = compilation.config.plugins.find(plugin => plugin.type === 'renderer')
        ? compilation.config.plugins.find(plugin => plugin.type === 'renderer').provider(compilation)
        : {};

      if (!await checkResourceExists(outputDir)) {
        await fs.mkdir(outputDir, {
          recursive: true
        });
      }

      if (prerender || prerenderPlugin.prerender) {
        // start any servers if needed
        const servers = [...compilation.config.plugins.filter((plugin) => {
          return plugin.type === 'server';
        }).map((plugin) => {
          const provider = plugin.provider(compilation);
  
          if (!(provider instanceof ServerInterface)) {
            console.warn(`WARNING: ${plugin.name}'s provider is not an instance of ServerInterface.`);
          }
  
          return provider;
        })];
  
        await Promise.all(servers.map(async (server) => {
          await server.start();
  
          return Promise.resolve(server);
        }));

        if (prerenderPlugin.workerUrl) {
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

      resolve();
    } catch (err) {
      reject(err);
    }
  });
  
};

export { runProductionBuild };