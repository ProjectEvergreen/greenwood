const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const webpackMerge = require('webpack-merge');

module.exports = (context) => {
  const commonConfig = require(path.join(__dirname, '..', './config/webpack.config.common.js'))(context);
  
  return webpackMerge(commonConfig, {

    mode: 'production',

    performance: {
      hints: 'error'
    },

    plugins: [  
      new HtmlWebpackPlugin({
        filename: '404.html',
        template: path.join(context.scratchDir, '404.html'),
        publicPath: commonConfig.output.publicPath
      })
    ]

  });
};