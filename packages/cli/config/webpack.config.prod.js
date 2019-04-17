const webpackMerge = require('webpack-merge');
const commonConfig = require('./webpack.config.common');
const HtmlWebpackPlugin = require('html-webpack-plugin');
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
// const FaviconsWebpackPlugin = require('favicons-webpack-plugin');

module.exports = (cfg) => {
  
  return webpackMerge(commonConfig(cfg), {

    mode: 'production',

    performance: {
      hints: 'error'
    },

    plugins: [
      new HtmlWebpackPlugin({
        filename: '404.html',
        template: '.greenwood/404.html',
        publicPath: cfg.publicPath
      })
      // new FaviconsWebpackPlugin({
      //   logo: './favicon.png',
      //   emitStats: true,
      //   prefix: 'icons/',
      //   statsFilename: 'icons/stats.json',
      //   inject: true,
      //   title: 'Create Evergreen App',
      //   background: '#466628',
      //   icons: {
      //     android: true,
      //     appleIcon: false,
      //     appleStartup: false,
      //     coast: false,
      //     favicons: true,
      //     firefox: true,
      //     opengraph: true,
      //     twitter: true,
      //     yandex: false,
      //     windows: false
      //   }
      // }),

      // new BundleAnalyzerPlugin({
      //   analyzerMode: 'static',
      //   openAnalyzer: false
      // })
    ]
  });
};