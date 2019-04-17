const path = require('path');
const webpackMerge = require('webpack-merge');
const commonConfig = require('./webpack.config.common');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const FilewatcherPlugin = require('filewatcher-webpack-plugin');
const generateBuild = require('../lib/generate');

let isRebuilding = false;

const rebuild = async() => {
  if (!isRebuilding) {
    isRebuilding = true;
    // rebuild web components
    await generateBuild();
    // debounce
    setTimeout(() => {
      isRebuilding = false;
    }, 1000);
  }
};

module.exports = (cfg) => {
  const { devServer, publicPath } = cfg;
  const { host, port } = devServer;

  return webpackMerge(commonConfig(cfg), {
    
    mode: 'development',

    entry: [
      `webpack-dev-server/client?http://${host}:${port}`,
      path.join(cfg.scratchDir, 'app', 'app.js')
    ],

    devServer: {
      port,
      host,
      historyApiFallback: true,
      hot: false,
      inline: true
    },

    plugins: [
      // new webpack.HotModuleReplacementPlugin(),
      new FilewatcherPlugin({
        watchFileRegex: [`/${cfg.rootContext}/`], 
        onReadyCallback: () => { 
          console.log(`Now serving Development Server available at http://${host}:${port}`);
        },
        // eslint-disable-next-line no-unused-vars
        onChangeCallback: async (path) => {
          rebuild();
        },
        usePolling: true,
        atomic: true,
        ignored: '/node_modules/'
      }),
      new ManifestPlugin({
        fileName: 'manifest.json',
        publicPath
      }),
      new HtmlWebpackPlugin({
        filename: 'index.html',
        template: '.greenwood/index.dev.html',
        publicPath
      }),
      new HtmlWebpackPlugin({
        filename: '404.html',
        template: '.greenwood/404.dev.html',
        publicPath
      })
    ]
  });
};