const dataServer = require('../data/server');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');

module.exports = runDevServer = async (compilation) => {
  return new Promise(async (resolve, reject) => {

    try {
      await dataServer(compilation).listen().then((server) => {
        console.log(`dataServer started at ${server.url}`);
      });

      const webpackConfig = require(compilation.context.webpackDevelop)(compilation);
      const devServerConfig = webpackConfig.devServer;

      let compiler = webpack(webpackConfig);
      let webpackServer = new WebpackDevServer(compiler, devServerConfig);
      
      webpackServer.listen(devServerConfig.port);
    } catch (err) {
      reject(err);
    }
  
  });
};