const path = require('path');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');

module.exports = runDevServer = async (compilation) => {
  return new Promise(async (resolve, reject) => {

    try {
      const webpackConfig = require(path.join(__dirname, '..', './config/webpack.config.develop.js'))(compilation);
      const devServerConfig = webpackConfig.devServer;

      WebpackDevServer.addDevServerEntrypoints(webpackConfig, devServerConfig);
      let compiler = webpack(webpackConfig);
      let webpackServer = new WebpackDevServer(compiler, devServerConfig);
      
      webpackServer.listen(devServerConfig.port);
    } catch (err) {
      reject(err);
    }
  
  });
};