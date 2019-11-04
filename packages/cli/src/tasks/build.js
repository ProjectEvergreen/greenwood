const path = require('path');
const webpack = require('webpack');
const serializeBuild = require('../lifecycles/serialize');
const runGraphQLServer = require('../../../plugin-graphql/src/server.js');

module.exports = runProductionBuild = async(compilation) => {
  return new Promise(async (resolve, reject) => {

    try {
      runGraphQLServer(compilation.graph);
      console.log('Building SPA from compilation...');
      await runWebpack(compilation);
      await serializeBuild(compilation);

      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

// eslint-disable-next-line no-unused-vars
const runWebpack = async (compilation) => {
  const webpackConfig = require(path.join(__dirname, '..', './config/webpack.config.prod.js'))(compilation);

  return new Promise(async (resolve, reject) => {

    try {
      return webpack(webpackConfig, (err, stats) => {
        if (err || stats.hasErrors()) {
          if (stats && stats.hasErrors()) {
            err = stats.toJson('minimal').errors[0];
          }
          reject(err);
        } else {
          console.log('webpack build complete');
          resolve();
        }
      });
    } catch (err) {
      reject(err);
    }

  });
};