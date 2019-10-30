const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const webpackMerge = require('webpack-merge');
const commonConfig = require('./webpack.config.common.js');

module.exports = ({ config, context, graph }) => {
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

  return webpackMerge(configWithContext, {

    mode: 'production',

    performance: {
      hints: 'warning'
    },

    plugins: [
      new HtmlWebpackPlugin({
        filename: path.join(context.publicDir, context.indexPageTemplate),
        template: path.join(context.scratchDir, context.indexPageTemplate),
        chunksSortMode: 'dependency',
        ...customOptions
      }),
      new HtmlWebpackPlugin({
        filename: path.join(context.publicDir, context.notFoundPageTemplate),
        template: path.join(context.scratchDir, context.notFoundPageTemplate),
        chunksSortMode: 'dependency',
        ...customOptions
      })
    ]
  });

};