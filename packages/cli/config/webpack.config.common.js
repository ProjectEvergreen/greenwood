const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {

  entry: {
    index: path.join(process.cwd(), '.greenwood', 'app.js')
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
      use: ['css-to-string-loader', 'css-loader', 'postcss-loader']
    }, {
      test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      loader: 'url-loader?limit=10000&mimetype=application/font-woff'
    }, {
      test: /\.(ttf|eot|svg|jpe?g|png|gif|otf)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      loader: 'file-loader'
    }]
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(process.cwd(), '.greenwood', 'index.html'),
      chunksSortMode: 'dependency'
    })
  ]
};