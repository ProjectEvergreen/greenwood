const generateCompilation = require('../lifecycles/compile');
const { ServerInterface } = require('../lib/server-interface');
const { devServer } = require('../lifecycles/serve');

module.exports = runDevServer = async () => {

  return new Promise(async (resolve, reject) => {

    try {
      const compilation = await generateCompilation();
      const { port } = compilation.config.devServer;
      
      devServer(compilation).listen(port, () => {
        
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

        return Promise.all(servers.map(async (server) => {
          return server.start();
        }));
      });
    } catch (err) {
      reject(err);
    }

  });
};