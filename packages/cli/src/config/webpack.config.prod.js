const webpackMerge = require('webpack-merge');
const commonConfig = require('./webpack.config.common.js');

module.exports = ({ config, context, graph }) => {
  const configWithContext = commonConfig({ config, context, graph });

  return webpackMerge(configWithContext, {

    mode: 'production',

    devtool: 'none',
    
    performance: {
      hints: 'warning'
    }

  });

};