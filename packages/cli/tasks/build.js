const path = require('path');
const webpack = require('webpack');
const webpackMerge = require('webpack-merge');
const serializeBuild = require('../lib/serialize');

module.exports = runProductionBuild = async(compilation) => {
  return new Promise(async (resolve, reject) => {

    try {      
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
const runWebpack = async ({ context }) => {
  const commonConfig = require(path.join(__dirname, '..', './config/webpack.config.common.js'))(context);
  const prodConfig = require(path.join(__dirname, '..', './config/webpack.config.prod.js'))(context);
  const webpackConfig = webpackMerge(commonConfig, prodConfig);

  return new Promise(async (resolve, reject) => {

    try {
      return webpack(webpackConfig, (err, stats) => {
        if (err || stats.hasErrors()) {
          if (stats.hasErrors()) {
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