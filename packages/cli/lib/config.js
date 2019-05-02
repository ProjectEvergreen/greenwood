const fs = require('fs');
const path = require('path');
const url = require('url');

let defaultConfig = {
  workspace: path.join(process.cwd(), 'src'),
  devServer: {
    port: 1984,
    host: 'http://localhost'
  },
  publicPath: '/'
};

module.exports = readAndMergeConfig = async(injectedConfig) => {
  return new Promise((resolve, reject) => {
    try {
      // deep clone of default config
      let customConfig = JSON.parse(JSON.stringify(defaultConfig));
      
      if (injectedConfig || fs.existsSync(path.join(process.cwd(), 'greenwood.config.js'))) {
        const userCfgFile = injectedConfig ? injectedConfig : require(path.join(process.cwd(), 'greenwood.config.js'));
        const { workspace, devServer, publicPath } = userCfgFile;
          
        // workspace validation
        if (workspace) {
          if (typeof workspace !== 'string') {
            reject('Error: greenwood.config.js workspace path must be a string');
          }

          if (!path.isAbsolute(workspace)) {
            // prepend relative path with current directory
            customConfig.workspace = path.join(process.cwd(), workspace);
          }

          if (!fs.existsSync(workspace)) {
            reject('Error: greenwood.config.js workspace doesn\'t exist! \n' +
              'common issues to check might be: \n' + 
              '- typo in your workspace directory name, or in greenwood.config.js \n' +
              '- if using relative paths, make sure your workspace is in the same cwd as _greenwood.config.js_ \n' +
              '- consider using an absolute path, e.g. path.join(__dirname, \'my\', \'custom\', \'path\') // <__dirname>/my/custom/path/ ');
          }
        }

        if (publicPath) {
          if (typeof publicPath !== 'string') {
            reject('Error: greenwood.config.js publicPath must be a string');
          } else {
            customConfig.publicPath = userCfgFile.publicPath;
            // console.log('custom publicPath provided => ', customConfig.publicPath);
          }
        }

        // devServer checks
        if (devServer && Object.keys(devServer).length > 0) {
          
          if (devServer.host) {
            // eslint-disable-next-line max-depth
            if (url.parse(devServer.host).hostname === null) {
              reject(`Error: greenwood.config.js devServer host type must be a valid url, including http://.  Passed value was: ${devServer.host}`);
            } else {
              customConfig.devServer.host = devServer.host;
              // console.log(`custom host provided => ${customConfig.devServer.host}`);
            }
          }

          if (devServer.port) {
            // eslint-disable-next-line max-depth
            if (!Number.isInteger(devServer.port)) {
              reject(`Error: greenwood.config.js devServer port must be an integer.  Passed value was: ${devServer.port}`);
            } else {
              customConfig.devServer.port = devServer.port;
              // console.log(`custom port provided => ${customConfig.devServer.port}`);
            }
          }
        }
      }

      resolve({ ...defaultConfig, ...customConfig });
    } catch (err) {
      reject(err);
    }
  });
};