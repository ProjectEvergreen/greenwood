const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const fs = require('fs-extra');
const webpack = require('webpack');

const userWorkspace = path.join(process.cwd(), 'src');
const defaultTemplate = path.join(__dirname, '../templates/');
let CONFIG = {
  componentDir: defaultTemplate,
  assetDir: defaultTemplate,
  stylesDir: defaultTemplate,
  pagesDir: defaultTemplate
};

if (fs.existsSync(userWorkspace)) {
  CONFIG = {
    componentDir: path.join(userWorkspace, 'components/'),
    assetDir: path.join(userWorkspace, 'assets/'),
    stylesDir: path.join(userWorkspace, 'styles/'),
    pagesDir: path.join(userWorkspace, 'pages/')
  };
}

module.exports = {

  entry: {
    index: path.join(process.cwd(), '.greenwood', 'app', 'app.js')
  },

  output: {
    path: path.join(process.cwd(), 'public'),
    filename: '[name].[chunkhash].bundle.js',
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
    new webpack.NormalModuleReplacementPlugin(
      /components/,
      (resource) => {
        resource.request = resource.request.replace(/\.\.\/components/, CONFIG.componentDir);
      }),
    new webpack.NormalModuleReplacementPlugin(
      /styles/,
      (resource) => {
        resource.request = resource.request.replace(/\.\.\/styles/, CONFIG.stylesDir);
      }),
    new webpack.NormalModuleReplacementPlugin(
      /assets/,
      (resource) => {
        resource.request = resource.request.replace(/\.\.\/assets/, CONFIG.assetDir);
      }),
    new webpack.NormalModuleReplacementPlugin(
      /\.md/,
      (resource) => {
        resource.request = resource.request.replace(/^\.\//, CONFIG.pagesDir);
      }),
    new HtmlWebpackPlugin({
      template: path.join(process.cwd(), '.greenwood', 'index.html'),
      chunksSortMode: 'dependency'
    })
  ]
};