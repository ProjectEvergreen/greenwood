const fs = require('fs');
const path = require('path');

module.exports = ejectConfigFiles = async (copyAllFiles) => {
  return new Promise(async (resolve, reject) => {
    try {

      if (copyAllFiles) {
        configFilePaths = fs.readdirSync(path.join(__dirname, '../config'));
      } else {
        configFilePaths = [
          'webpack.config.common.js',
          'webpack.config.develop.js',
          'webpack.config.prod.js'
        ];
      }
      configFilePaths.forEach(configFile => {
        fs.copyFileSync(path.join(__dirname, '../config', configFile), path.join(process.cwd(), configFile));
        console.log(`Ejecting ${configFile}`.blue);
      });
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};