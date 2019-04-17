// const fs = require('fs');
const path = require('path');
// const commonConfig = require('./webpack.config.common');
// const webpackMerge = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const FilewatcherPlugin = require('filewatcher-webpack-plugin');
const generateCompilation = require('../lib/compile');

const host = 'localhost';
const port = 1981;
const publicPath = '/'; // commonConfig.publicPath;
let isRebuilding = false;

const rebuild = async() => {
  if (!isRebuilding) {
    isRebuilding = true;
    // rebuild web components
    await generateCompilation();
    // debounce
    setTimeout(() => {
      isRebuilding = false;
    }, 1000);
  }
};

module.exports = getDevelopConfig = (context) => {

  return {
    mode: 'development',

    // TODO magic strings - .greenwood, app, app.js
    entry: [
      `webpack-dev-server/client?http://${host}:${port}`,
      path.join(process.cwd(), '.greenwood', 'app', 'app.js')
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
        watchFileRegex: [`/${context.userWorkspace}/`], 
        onReadyCallback: () => { 
          console.log(`Now serving Development Server available at http://${host}:${port}`);
        },
        // eslint-disable-next-line no-unused-vars
        onChangeCallback: async () => {
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
      // TODO magic string paths (index.html)
      new HtmlWebpackPlugin({
        filename: 'index.html',
        template: '.greenwood/index.dev.html',
        publicPath
      }),
      // TODO magic string paths (404.html)
      new HtmlWebpackPlugin({
        filename: '404.html',
        template: '.greenwood/404.dev.html',
        publicPath
      })
    ]
  };
};