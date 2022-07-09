import { bundleCompilation } from '../lifecycles/bundle.js';
import { copyAssets } from '../lifecycles/copy.js';
import fs from 'fs';
import { preRenderCompilationWorker, preRenderCompilationCustom, staticRenderCompilation } from '../lifecycles/prerender.js';
import { ServerInterface } from '../lib/server-interface.js';

const runProductionBuild = async (compilation) => {

  return new Promise(async (resolve, reject) => {

    try {
      const { prerender } = compilation.config;
      const outputDir = compilation.context.outputDir;
      const defaultPrerender = (compilation.config.plugins.filter(plugin => plugin.type === 'renderer' && plugin.isGreenwoodDefaultPlugin) || []).length === 1
        ? compilation.config.plugins.filter(plugin => plugin.type === 'renderer')[0].provider(compilation)
        : {};
      const customPrerender = (compilation.config.plugins.filter(plugin => plugin.type === 'renderer' && !plugin.isGreenwoodDefaultPlugin) || []).length === 1
        ? compilation.config.plugins.filter(plugin => plugin.type === 'renderer')[0].provider(compilation)
        : {};

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
      }

      // Options
      // 1. default (greenwood.config.js) - Worker
      // 2. plugin

      // Options
      // - Worker (e.g. Node.js SSR)
      // - Headless (e.g. Browsers)
      
      // TODO
      // 1. Start all custom servers
      // 2. Detect plugin and type
      // 2a. worker
      // 2b. headless
      // 3. Else detect default render
      // 3a. prerender
      // 3b. static

      if (prerender || customPrerender.prerender) {
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

        if (customPrerender.workerUrl) {
          console.debug('TODO preRenderCompilationWorker');
          await preRenderCompilationWorker(compilation, customPrerender);
        } else if (customPrerender.customUrl) {
          await preRenderCompilationCustom(compilation, customPrerender);
        } else if (defaultPrerender && prerender) {
          console.debug('TODO preRenderCompilationWorker with default prerender');
          await preRenderCompilationWorker(compilation, defaultPrerender);
        } else {
          reject('This is an unhandled pre-rendering case!  Please report.');
        }
      } else {
        await staticRenderCompilation(compilation);
      }

      await bundleCompilation(compilation);
      await copyAssets(compilation);

      resolve();
    } catch (err) {
      reject(err);
    }
  });
  
};

export { runProductionBuild };