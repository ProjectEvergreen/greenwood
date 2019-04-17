// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
// const FaviconsWebpackPlugin = require('favicons-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = () => {

  return {

    mode: 'production',

    performance: {
      hints: 'error'
    },

    plugins: [
      // TODO magic strings 404 html
      new HtmlWebpackPlugin({
        filename: '404.html',
        template: '.greenwood/404.html',
        publicPath: '/' // TOOD reuse from common config
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
  };
};