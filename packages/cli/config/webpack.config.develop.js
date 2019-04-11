const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const commonConfig = require('./webpack.config.common');
const webpackMerge = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const FilewatcherPlugin = require('filewatcher-webpack-plugin');
const generateBuild = require('../lib/generate');
let isRebuilding = false;

const userWorkspace = fs.existsSync(path.join(process.cwd(), 'src'))
  ? path.join(process.cwd(), 'src')
  : path.join(__dirname, '..', 'templates/');

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

const publicPath = '/';

module.exports = webpackMerge(commonConfig, {
  
  mode: 'development',

  entry: [
    'webpack-dev-server/client?http://localhost:1981',
    path.join(process.cwd(), '.greenwood', 'app', 'app.js')
  ],

  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new FilewatcherPlugin({
      watchFileRegex: [`/${userWorkspace}/`], 
      onReadyCallback: () => { 
        console.log('Now serving Development Server available at http://localhost:1981');
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
      template: path.resolve(__dirname, '..', 'templates/index.dev.html'),
      publicPath
    }),
    new HtmlWebpackPlugin({
      filename: '404.html',
      template: path.resolve(__dirname, '..', 'templates/404.dev.html'),
      publicPath
    })
  ]
});