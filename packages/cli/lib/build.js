const path = require('path');
const webpack = require('webpack');
const webpackConfig = require(path.join(__dirname, '..', './config/webpack.config.prod.js'));

module.exports = buildCompilation = async (config, compilation) => {
  return new Promise(async (resolve, reject) => {
    
    try {
      return webpack(webpackConfig, (err, stats) => {
        // TODO webpack errors don't break this task
        if (err || stats.hasErrors()) {
          if(stats.hasErrors()) {
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