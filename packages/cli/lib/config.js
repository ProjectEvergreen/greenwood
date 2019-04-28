const fs = require('fs');
const path = require('path');
const url = require('url');

let config = {
  workspace: path.join(process.cwd(), 'src'),
  devServer: {
    port: 1984,
    host: 'http://localhost'
  },
  publicPath: '/',
  // TODO add global meta data see issue #5
  // https://github.com/ProjectEvergreen/greenwood/issues/5
  meta: { 
    title: '',
    description: '',
    author: '',
    domain: ''
  }
};

module.exports = readAndMergeConfig = async() => {
  return new Promise((resolve, reject) => {
    try {
      if (fs.existsSync(path.join(process.cwd(), 'greenwood.config.js'))) {
        const userCfgFile = require(path.join(process.cwd(), 'greenwood.config.js'));
    
        // prepend userCfgFile devServer.host with http by default
        userCfgFile.devServer.host = 'http://' + userCfgFile.devServer.host;

        const { workspace, devServer, publicPath } = userCfgFile;
          
        if (workspace && typeof userCfgFile.workspace !== 'string') {
          reject('Error: greenwood.config.js workspace path must be a string');
        }

        // prepend paths with current directory
        if (workspace && !path.isAbsolute(workspace)) {
          userCfgFile.workspace = path.join(process.cwd(), workspace);
        }

        if (workspace && !fs.existsSync(userCfgFile.workspace)) {
          reject('Error: greenwood.config.js workspace doesn\'t exist! \n' +
            'common issues to check might be: \n' + 
            '- typo in your workspace directory name, or in greenwood.config.js \n' +
            '- if using relative paths, make sure your workspace is in the same cwd as _greenwood.config.js_ \n' +
            '- consider using an absolute path, e.g. path.join(__dirname, \'my\', \'custom\', \'path\') // <__dirname>/my/custom/path/ ');
        }

        if (publicPath && typeof publicPath !== 'string') {
          reject('Error: greenwood.config.js publicPath must be a string');
        }

        if (Object.keys(devServer).length > 0) {
          
          if (url.parse(devServer.host).hostname === null) {
            reject('Error: greenwood.config.js devServer host type must be a valid url');
          }

          if (!Number.isInteger(devServer.port)) {
            reject('Error: greenwood.config.js devServer port must be an integer');
          }
        }
      
        config = { ...config, ...userCfgFile };
      }
      resolve(config);

    } catch (err) {
      reject(err);
    }
  });
};