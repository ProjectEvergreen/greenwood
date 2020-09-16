// TODO const dataServer = require('../data/server');
const { app, liveReloadServer } = require('../lifecycles/serve');

module.exports = runDevServer = async (compilation) => {
  return new Promise(async (resolve, reject) => {

    try {
      const { port } = compilation.config.devServer;
      const { userWorkspace } = compilation.context;
      
      app.listen(port, () => {
        console.info(`Started local development at localhost:${port}`);
        console.info(`Now watching directory "${userWorkspace}" for changes.`);
        
        liveReloadServer.watch(userWorkspace);
      });
      // await dataServer(compilation).listen().then((server) => {
      //   console.log(`dataServer started at ${server.url}`);
      // });

      // const webpackConfig = require(compilation.context.webpackDevelop)(compilation);
      // const devServerConfig = webpackConfig.devServer;

      // let compiler = webpack(webpackConfig);
      // let webpackServer = new WebpackDevServer(compiler, devServerConfig);
      
      // webpackServer.listen(devServerConfig.port);
    } catch (err) {
      reject(err);
    }
  
  });
};