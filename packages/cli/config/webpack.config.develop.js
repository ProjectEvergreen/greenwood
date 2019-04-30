const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const FilewatcherPlugin = require('filewatcher-webpack-plugin');
const generateCompilation = require('../lib/compile');
const webpackMerge = require('webpack-merge');
const commonConfig = require(path.join(__dirname, '..', './config/webpack.config.common.js'));
const CleanWebpackPlugin = require('clean-webpack-plugin');
const WebpackBeforeBuildPlugin = require('before-build-webpack');

const host = 'localhost';
const port = 1981;
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

module.exports = ({ context, graph }) => {
  pageGraph = graph;
  const configWithContext = commonConfig(context, graph);
  const publicPath = configWithContext.output.publicPath;

  return webpackMerge(configWithContext, {

    mode: 'development',
    entry: [
      path.join(context.scratchDir, 'app', 'app.js')
    ],

    devServer: {
      port,
      host,
      historyApiFallback: true,
      hot: true,
      inline: true
    },

    plugins: [
      new webpack.HotModuleReplacementPlugin(),
      // new webpack.ProgressPlugin(function(percentage, msg) {
      //   if (percentage === 1) {
      //     rebuild();
      //   }
      // }),
      // new CleanWebpackPlugin()
      // new WebpackBeforeBuildPlugin(function(stats, callback) {
      //   rebuild();
      //   callback(); // don't call it if you do want to stop compilation
      // }),
      new FilewatcherPlugin({
        watchFileRegex: [`/${context.userWorkspace}/`],
        ignoreInitial: true,
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
        template: path.join(context.scratchDir, context.indexPageTemplate),
        spaIndexFallbackScript: `
          <script>
          (function(){
              var redirect = sessionStorage.redirect;
              delete sessionStorage.redirect;
              if (redirect && redirect != location.href) {
              history.replaceState(null, null, redirect);
              }
          })();
          </script>
        `
      }),
      new HtmlWebpackPlugin({
        filename: context.notFoundPageTemplate,
        template: path.join(context.scratchDir, context.notFoundPageTemplate),
        spaIndexFallbackScript: `
          <script>
            sessionStorage.redirect = location.href;
          </script>
      
          <meta http-equiv="refresh" content="0;URL='${publicPath}'"></meta>
        `
      })
    ]
  });
};