const commonConfig = require('./webpack.config.common');
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
// const FaviconsWebpackPlugin = require('favicons-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const webpackMerge = require('webpack-merge');
const path = require('path');
const publicPath = '/';

console.log(process.cwd());
console.log(path.resolve(process.cwd(), 'packages', 'cli', 'templates', '404.html'));

module.exports = webpackMerge(commonConfig, {

  mode: 'production',

  performance: {
    hints: 'error'
  },

  plugins: [
    new HtmlWebpackPlugin({
      filename: '404.html',
      template: path.join(process.cwd(), '.greenwood', '404.html'),
      publicPath
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