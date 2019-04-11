const path = require('path');
const webpack = require('webpack');
const webpackDevConfig = require(path.join(__dirname, '..', './config/webpack.config.develop.js'));
const WebpackDevServer = require('webpack-dev-server');
const generateBuild = require('../lib/generate');
const port = 1981;

module.exports = runDevServer = async () => {
  return new Promise(async (resolve, reject) => {
      
    try {
      await generateBuild();

      let compiler = webpack(webpackDevConfig);
      let webpackServer = new WebpackDevServer(compiler, {
        port,
        host: 'localhost',
        historyApiFallback: true,
        hot: false,
        inline: true

      });
      
      webpackServer.listen(port);
  
    } catch (err) {
      reject(err);
    }
  
  });
};