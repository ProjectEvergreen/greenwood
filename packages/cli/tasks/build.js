const path = require('path');
const webpack = require('webpack');
const webpackConfig = require(path.join(__dirname, '..', './config/webpack.config.prod.js'));
const serializeBuild = require('../lib/serialize');
const generateBuild = require('../lib/generate');

module.exports = runProductionBuild = async() => {
  return new Promise(async (resolve, reject) => {
    
    try {
      const { config, compilation } = await generateBuild();
      
      console.log('Build SPA from scaffolding...');
      // build our SPA application first
      await buildCompilation(config, compilation);
      await serializeBuild(config, compilation);
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

// eslint-disable-next-line no-unused-vars
const buildCompilation = async () => {
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