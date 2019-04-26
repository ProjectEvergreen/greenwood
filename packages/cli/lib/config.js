const fs = require('fs');
const path = require('path');

let config = {
  source: path.join(process.cwd(), 'src'),
  devServer: {
    port: 1984,
    host: 'localhost'
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
  if (fs.existsSync(path.join(process.cwd(), 'greenwood.config.js'))) {
    const userCfgFile = require(path.join(process.cwd(), 'greenwood.config.js'));
      
    // prepend paths with current directory
    if (userCfgFile.source) {
      userCfgFile.source = path.join(process.cwd(), userCfgFile.source);
    }
  
    config = { ...config, ...userCfgFile };
  }
  return config;
};