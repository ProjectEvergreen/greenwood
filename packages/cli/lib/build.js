const path = require('path');
const webpack = require('webpack');
const webpackConfig = require(path.join(__dirname, '..', './config/webpack.config.prod.js'));

// console.log('webpackConfig', webpackConfig);

module.exports = buildCompilation = async (config, compilation) => {
  return new Promise(async (resolve, reject) => {
    try {
      // TODO Allow hooks into webpack configuration?
      // to add plugins loaders? 
      // our plugins are wrappers around access to webpack
      webpack(webpackConfig, () => {
        console.log('webpack built!');
        resolve();
      });
    } catch (err) {
      reject(err);
    }

  });
};