const path = require('path');
const webpack = require('webpack');
const webpackConfig = require(path.join(__dirname, '..', './config/webpack.config.prod.js'));

module.exports = buildCompilation = async (config, compilation) => {
  return new Promise(async (resolve, reject) => {
    console.log('webpackConfig', webpackConfig);
    
    try {
      // TODO Allow hooks into webpack configuration?
      // to add plugins loaders? 
      // our plugins are wrappers around access to webpack
      return webpack(webpackConfig, () => {
        console.log('webpack built!');
        resolve();
      });
    } catch (err) {
      reject(err);
    }

  });
};