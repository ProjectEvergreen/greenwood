// const bundleCompilation = require('../lifecycles/bundle');
// const copyAssets = require('../lifecycles/copy');
import { devServer } from '../lifecycles/serve.js';
import fs from 'fs';
import { generateCompilation } from '../lifecycles/compile.js';
// const { preRenderCompilation, staticRenderCompilation } = require('../lifecycles/prerender');
// const { ServerInterface } = require('../lib/server-interface');

const runProductionBuild = async () => {

  return new Promise(async (resolve, reject) => {

    try {
      const compilation = await generateCompilation();
      const { prerender } = compilation.config;
      const port = compilation.config.devServer.port;
      const outputDir = compilation.context.outputDir;

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
      }
      
      if (prerender) {
        await new Promise(async (resolve, reject) => {
          try {
            (await devServer(compilation)).listen(port, async () => {
              console.info(`Started local development server at localhost:${port}`);
  
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
                server.start();
      
                return Promise.resolve(server);
              }));
          
              // await preRenderCompilation(compilation);
  
              resolve();
            });
          } catch (e) {
            reject(e);
          }
        });
      } else {
        // wait staticRenderCompilation(compilation);
      }

      // await bundleCompilation(compilation);
      // await copyAssets(compilation);

      resolve();
    } catch (err) {
      reject(err);
    }
  });
  
};

export { runProductionBuild };