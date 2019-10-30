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

  // gets Index Hooks to pass as options to HtmlWebpackPlugin
  const customOptions = Object.assign({}, ...config.plugins
    .filter((plugin) => plugin.type === 'index')
    .map((plugin) => plugin.provider({ config, context }))
    .filter((providerResult) => {
      return Object.keys(providerResult).map((key) => {
        if (key !== 'type') {
          return providerResult[key];
        }
      });
    }));
  
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
        filename: path.join(context.publicDir, context.indexPageTemplate),
        template: path.join(context.scratchDir, context.indexPageTemplate),
        chunksSortMode: 'dependency',
        hookGreenwoodSpaIndexFallback: `
          <script>
          (function(){
            var redirect = sessionStorage.redirect;
            
            delete sessionStorage.redirect;
            
            if (redirect && redirect != location.href) {
              history.replaceState(null, null, redirect);
            }
          })();
          </script>
        `,
        ...customOptions
      }),
      new HtmlWebpackPlugin({
        filename: path.join(context.publicDir, context.notFoundPageTemplate),
        template: path.join(context.scratchDir, context.notFoundPageTemplate),
        chunksSortMode: 'dependency',
        hookGreenwoodSpaIndexFallback: `
          <script>
            sessionStorage.redirect = location.href;
          </script>

          <meta http-equiv="refresh" content="0;URL='${publicPath}'"></meta>
        `,
        ...customOptions
      })
    ]
  });
};