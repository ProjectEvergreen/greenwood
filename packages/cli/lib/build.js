const path = require('path');
const webpack = require('webpack');
const webpackConfig = require(path.join(__dirname, '..', './config/webpack.config.prod.js'));

module.exports = buildCompilation = async (config, compilation) => {
  return new Promise(async (resolve, reject) => {
    
    try {
      return webpack(webpackConfig, (err) => {
        // TODO webpack errors don't break this task
        if (err) {
          console.log(err);
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