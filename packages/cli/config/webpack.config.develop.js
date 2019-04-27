const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const FilewatcherPlugin = require('filewatcher-webpack-plugin');
const generateCompilation = require('../lib/compile');
const webpackMerge = require('webpack-merge');
const commonConfig = require(path.join(__dirname, '..', './config/webpack.config.common.js'));

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

module.exports = (context) => {
  const configWithContext = commonConfig(context);
  const publicPath = configWithContext.output.publicPath;

  return webpackMerge(configWithContext, {

    mode: 'development',

    entry: [
      `webpack-dev-server/client?http://${host}:${port}`,
      path.join(context.scratchDir, 'app', 'app.js')
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