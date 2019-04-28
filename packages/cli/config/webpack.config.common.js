const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const webpack = require('webpack');

const isDirectory = source => fs.lstatSync(source).isDirectory();
const getUserWorkspaceDirectories = (source) => {
  return fs.readdirSync(source).map(name => path.join(source, name)).filter(isDirectory);
};
const mapUserWorkspaceDirectory = (userPath) => {
  const directory = userPath.split('/')[userPath.split('/').length - 1];

  return new webpack.NormalModuleReplacementPlugin(
    new RegExp(`${directory}`),
    (resource) => {
      resource.request = resource.request.replace(new RegExp(`\.\.\/${directory}`), userPath);
      
      // remove any additional nests, after replacement with absolute path of user workspace + directory
      const additionalNestedPathIndex = resource.request.lastIndexOf('..');
      
      if (additionalNestedPathIndex > -1) {
        resource.request = resource.request.substring(additionalNestedPathIndex + 2, resource.request.length);
      }
    }
  );
};

module.exports = (context, graph) => {
  // dynamically map all the user's workspace directories for resolution by webpack
  // this essentially helps us keep watch over changes from the user, and greenwood's build pipeline
  const mappedUserDirectoriesForWebpack = getUserWorkspaceDirectories(context.userWorkspace).map(mapUserWorkspaceDirectory);

  return {

    entry: {
      index: path.join(context.scratchDir, 'app', 'app.js')
    },

    output: {
      path: context.publicDir,
      filename: '[name].[hash].bundle.js',
      publicPath: '/'
    },

    module: {
      rules: [{
        test: /\.js$/,
        enforce: 'pre',
        loader: 'eslint-loader',
        options: {
          configFile: path.join(__dirname, './.eslintrc')
        }
      }, {
        test: /\.js$/,
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env'],
          plugins: [
            ['babel-plugin-transform-builtin-classes', {
              globals: ['LitElement']
            }]
          ]
        }
      }, {
        test: /\.md$/,
        loader: 'wc-markdown-loader',
        options: {
          graph
        }
      }, {
        test: /\.css$/,
        loaders: [
          { loader: 'css-to-string-loader' },
          { loader: 'css-loader' }, 
          { loader: 'postcss-loader', options: 
            {
              config: {
                path: path.join(__dirname) 
              }
            } 
          }
        ]
      }, {
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'url-loader?limit=10000&mimetype=application/font-woff'
      }, {
        test: /\.(ttf|eot|svg|jpe?g|png|gif|otf)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'file-loader'
      }]
    },

    plugins: [
      ...mappedUserDirectoriesForWebpack,

      new webpack.NormalModuleReplacementPlugin(
        /\.md/,
        (resource) => {
          resource.request = resource.request.replace(/^\.\//, context.pagesDir);
        }
      ),
      
      new HtmlWebpackPlugin({
        template: path.join(context.scratchDir, context.indexPageTemplate),
        chunksSortMode: 'dependency'
      })
    ]
  };
};