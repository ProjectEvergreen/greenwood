const { version } = require('../../../package.json');
const webpack = require('webpack');

module.exports = {
  
  plugins: [{
    type: 'webpack',
    provider: () => {
      return new webpack.BannerPlugin(`My Banner - v${version}`);
    }
  }]
  
};