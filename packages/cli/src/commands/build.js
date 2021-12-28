import { bundleCompilation } from '../lifecycles/bundle.js';
import { copyAssets } from '../lifecycles/copy.js';
import { getDevServer } from '../lifecycles/serve.js';
import fs from 'fs';
import { generateCompilation } from '../lifecycles/compile.js';
import { preRenderCompilation, staticRenderCompilation } from '../lifecycles/prerender.js';
import { ServerInterface } from '../lib/server-interface.js';

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
            (await getDevServer(compilation)).listen(port, async () => {
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
          
              await preRenderCompilation(compilation);
  
              resolve();
            });
          } catch (e) {
            reject(e);
          }
        });
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