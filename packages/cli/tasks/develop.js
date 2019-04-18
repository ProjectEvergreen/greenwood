const path = require('path');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const webpackMerge = require('webpack-merge');

module.exports = runDevServer = async ({ context }) => {
  return new Promise(async (resolve, reject) => {

    try {
      const commonConfig = require(path.join(__dirname, '..', './config/webpack.config.common.js'))(context);
      const devConfig = require(path.join(__dirname, '..', './config/webpack.config.develop.js'))(context);
      const webpackConfig = webpackMerge(commonConfig, devConfig);
      const devServerConfig = webpackConfig.devServer;

      let compiler = webpack(webpackConfig);
      let webpackServer = new WebpackDevServer(compiler, devServerConfig);
      
      webpackServer.listen(devServerConfig.port);
    } catch (err) {
      reject(err);
    }
  
  });
};