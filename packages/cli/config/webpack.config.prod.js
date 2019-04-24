const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const webpackMerge = require('webpack-merge');
const commonConfig = require(path.join(__dirname, '..', './config/webpack.config.common.js'));

module.exports = (context) => {
  const configWithContext = commonConfig(context);

  return webpackMerge(configWithContext, {

    mode: 'production',

    performance: {
      hints: 'error'
    },

    plugins: [  
      new HtmlWebpackPlugin({
        filename: '404.html',
        template: context.notFoundPageScratch,
        publicPath: configWithContext.output.publicPath
      })
    ]

  });

};