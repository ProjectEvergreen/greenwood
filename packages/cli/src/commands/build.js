const bundleCompilation = require('../lifecycles/bundle');
const copyAssets = require('../lifecycles/copy');
const { devServer } = require('../lifecycles/serve');
const fs = require('fs');
const generateCompilation = require('../lifecycles/compile');
const { preRenderCompilation, staticRenderCompilation } = require('../lifecycles/prerender');
const { ServerInterface } = require('../lib/server-interface');

module.exports = runProductionBuild = async () => {

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
        await new Promise((resolve, reject) => {
          try {
            devServer(compilation).listen(port, async () => {
              console.info(`Started local development server at localhost:${port}`);
              
              // custom user server plugins
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