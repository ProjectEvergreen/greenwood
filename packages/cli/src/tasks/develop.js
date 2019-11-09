const path = require('path');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const runGraphQLServer = require('../../../plugin-graphql/src/server.js');

module.exports = runDevServer = async (compilation) => {
  return new Promise(async (resolve, reject) => {

    try {
      runGraphQLServer(compilation);
      const webpackConfig = require(path.join(__dirname, '..', './config/webpack.config.develop.js'))(compilation);
      const devServerConfig = webpackConfig.devServer;

      let compiler = webpack(webpackConfig);
      let webpackServer = new WebpackDevServer(compiler, devServerConfig);

      webpackServer.listen(devServerConfig.port);

    } catch (err) {
      reject(err);
    }

  });
};