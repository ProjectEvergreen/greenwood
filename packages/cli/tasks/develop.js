const path = require('path');
const webpack = require('webpack');
const webpackDevConfig = require(path.join(__dirname, '..', './config/webpack.config.develop.js'));
const WebpackDevServer = require('webpack-dev-server');
const generateBuild = require('../lib/generate');

module.exports = runDevServer = async () => {
  return new Promise(async (resolve, reject) => {
    
    process.env.NODE_ENV = 'development';

    try {
      const { config } = await generateBuild();

      const serverConfig = webpackDevConfig(config).devServer;
      let compiler = webpack(webpackDevConfig(config));
      let webpackServer = new WebpackDevServer(compiler, serverConfig);
      
      webpackServer.listen(serverConfig.port);
    } catch (err) {
      reject(err);
    }
  
  });
};