const bundleCompilation = require('../lifecycles/bundle');
const copyAssets = require('../lifecycles/copy');
const { devServer } = require('../lifecycles/serve');
const fs = require('fs');
const generateCompilation = require('../lifecycles/compile');
const serializeCompilation = require('../lifecycles/serialize');
const { ServerInterface } = require('../lib/server-interface');

module.exports = runProductionBuild = async () => {

  return new Promise(async (resolve, reject) => {

    try {
      const compilation = await generateCompilation();
      const port = compilation.config.devServer.port;
      const outputDir = compilation.context.outputDir;

      devServer(compilation).listen(port);

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
        return server.start();
      }));
  
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
      }
  
      await serializeCompilation(compilation);
      await bundleCompilation(compilation);
      await copyAssets(compilation);

      resolve();
    } catch (err) {
      reject(err);
    }
  });
  
};