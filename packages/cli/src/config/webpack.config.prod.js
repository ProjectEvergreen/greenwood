const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const webpackMerge = require('webpack-merge');
const commonConfig = require(path.join(__dirname, './webpack.config.common.js'));

module.exports = ({ config, context, graph }) => {
  const configWithContext = commonConfig({ config, context, graph });

  return webpackMerge(configWithContext, {

    mode: 'production',

    performance: {
      hints: 'warning'
    },

    plugins: [
      new HtmlWebpackPlugin({
        filename: path.join(context.publicDir, context.notFoundPageTemplate),
        template: path.join(context.scratchDir, context.notFoundPageTemplate),
        publicPath: configWithContext.output.publicPath
      })
    ]
  });

};