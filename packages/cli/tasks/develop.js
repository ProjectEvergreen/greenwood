const path = require('path');
const webpack = require('webpack');
const webpackDevConfig = require(path.join(__dirname, '..', './config/webpack.config.develop.js'));
const WebpackDevServer = require('webpack-dev-server');
// const generateBuild = require('../lib/generate');

module.exports = runDevServer = async () => {
  return new Promise(async (resolve, reject) => {
      
    try {
      await generateBuild();

      let compiler = webpack(webpackDevConfig);
      let webpackServer = new WebpackDevServer(compiler);
  
      webpackServer.listen(webpackDevConfig.devServer.port);
  
    } catch (err) {
      reject(err);
    }
  
  });
};