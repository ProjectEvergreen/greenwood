const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const fs = require('fs');
const webpack = require('webpack');

const isDirectory = source => fs.lstatSync(source).isDirectory();
const getUserWorkspaceDirectories = (source) => {
  return fs.readdirSync(source).map(name => path.join(source, name)).filter(isDirectory);
};

module.exports = (cfg) => {

  const mappedUserDirectoriesForWebpack = getUserWorkspaceDirectories(cfg.rootContext).map((userPath) => {
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
      });
  });

  return {

    entry: {
      index: path.join(cfg.scratchDir, 'app', 'app.js')
    },

    output: {
      path: path.join(cfg.publicDir),
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
        loaders: [
          'babel-loader',
          'wc-markdown-loader'
        ]
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
          resource.request = resource.request.replace(/^\.\//, cfg.pagesDir + '/');
        }),
      
      new HtmlWebpackPlugin({
        template: path.join(cfg.scratchDir, 'index.html'),
        chunksSortMode: 'dependency'
      })
    ]
  };
};