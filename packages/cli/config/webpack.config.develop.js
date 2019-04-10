const fs = require('fs');
const path = require('path');
const commonConfig = require('./webpack.config.common');
const webpackMerge = require('webpack-merge');
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

module.exports = webpackMerge(commonConfig, {
  
  mode: 'development',

  devServer: {
    port: 1981,
    host: 'localhost',
    historyApiFallback: true,
    watchOptions: {
      aggregateTimeout: 300,
      poll: 1000,
      ignored: /node_modules/
    }
  },

  plugins: [
    new ManifestPlugin({
      fileName: 'icons/manifest.json'
    }),
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
    })
  ]
});