const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const FilewatcherPlugin = require('filewatcher-webpack-plugin');
const generateCompilation = require('../lifecycles/compile');
const webpackMerge = require('webpack-merge');
const commonConfig = require('./webpack.config.common.js');

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

module.exports = ({ config, context, graph }) => {
  config.publicPath = '/';
  
  const configWithContext = commonConfig({ config, context, graph });
  const { devServer, publicPath } = config;
  const { host, port } = devServer;

  return webpackMerge(configWithContext, {

    mode: 'development',

    entry: [
      `webpack-dev-server/client?http://${host}:${port}`,
      path.join(context.scratchDir, 'app', 'app.js')
    ],

    devServer: {
      port,
      host,
      disableHostCheck: true,
      historyApiFallback: true,
      hot: false,
      inline: true
    },

    plugins: [
      new FilewatcherPlugin({
        watchFileRegex: [`/${context.userWorkspace}/`],
        onReadyCallback: () => {
          console.log(`Now serving Development Server available at ${host}:${port}`);
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
        hookSpaIndexFallback: `
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
        hookSpaIndexFallback: `
          <script>
            sessionStorage.redirect = location.href;
          </script>

          <meta http-equiv="refresh" content="0;URL='${publicPath}'"></meta>
        `
      })
    ]
  });
};