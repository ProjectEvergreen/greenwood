const path = require('path');
const webpack = require('webpack');
const webpackDevConfig = require(path.join(__dirname, '..', './config/webpack.config.develop.js'));
const WebpackDevServer = require('webpack-dev-server');
const generateBuild = require('../lib/generate');

module.exports = runDevServer = async () => {
  return new Promise(async (resolve, reject) => {
    
    process.env.NODE_ENV = 'development';

    try {
      await generateBuild();

      const serverConfig = webpackDevConfig.devServer;
      let compiler = webpack(webpackDevConfig);
      let webpackServer = new WebpackDevServer(compiler, serverConfig);
      
      webpackServer.listen(serverConfig.port);
    } catch (err) {
      reject(err);
    }
  
  });
};