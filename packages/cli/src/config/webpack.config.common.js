const CopyWebpackPlugin = require('copy-webpack-plugin');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const webpack = require('webpack');

const getUserWorkspaceDirectories = (source) => {
  return fs.readdirSync(source)
    .map(name => path.join(source, name))
    .filter(path => fs.lstatSync(path).isDirectory());
};
const mapUserWorkspaceDirectories = (directoryPath, userWorkspaceDirectory) => {
  const directoryName = directoryPath.replace(`${userWorkspaceDirectory}/`, '');
  const userWorkspaceDirectoryRoot = userWorkspaceDirectory.split('/').slice(-1);

  return new webpack.NormalModuleReplacementPlugin(
    // https://github.com/ProjectEvergreen/greenwood/issues/132
    new RegExp(`\\.\\.\\/${directoryName}.+$(?<!\.js)|${userWorkspaceDirectoryRoot}\\/${directoryName}.+$(?<!\.js)`),
    (resource) => {

      // workaround to ignore cli/templates default imports when rewriting
      if (!new RegExp('\/cli\/templates').test(resource.content)) {
        resource.request = resource.request.replace(new RegExp(`\\.\\.\\/${directoryName}`), directoryPath);
      }

      // remove any additional nests, after replacement with absolute path of user workspace + directory
      const additionalNestedPathIndex = resource.request.lastIndexOf('..');

      if (additionalNestedPathIndex > -1) {
        resource.request = resource.request.substring(additionalNestedPathIndex + 2, resource.request.length);
      }
    }

  );
};

module.exports = ({ config, context }) => {
  const { userWorkspace } = context;

  // dynamically map all the user's workspace directories for resolution by webpack
  // this essentially helps us keep watch over changes from the user's workspace forgreenwood's build pipeline
  const mappedUserDirectoriesForWebpack = getUserWorkspaceDirectories(userWorkspace)
    .map((directory) => {
      return mapUserWorkspaceDirectories(directory, userWorkspace);
    });

  // if user has an assets/ directory in their workspace, automatically copy it for them
  const userAssetsDirectoryForWebpack = fs.existsSync(context.assetDir) ? [{
    from: context.assetDir,
    to: path.join(context.publicDir, 'assets')
  }] : [];

  const commonCssLoaders = [
    { loader: 'css-loader' },
    {
      loader: 'postcss-loader',
      options: {
        config: {
          path: context.postcssConfig
        }
      }
    }
  ];

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

  // utilizes webpack plugins passed in directly by the user
  const customWebpackPlugins = config.plugins
    .filter((plugin) => plugin.type === 'webpack')
    .map((plugin) => plugin.provider({ config, context }));

  return {
    
    resolve: {
      extensions: ['.js', '.json', '.gql', '.graphql'],
      alias: {
        '@greenwood/cli/data': path.join(__dirname, '..', './data')
      }
    },

    entry: {
      index: path.join(context.scratchDir, 'app', 'app.js')
    },

    output: {
      path: path.join(context.publicDir, '.', config.publicPath),
      filename: '[name].[hash].bundle.js',
      chunkFilename: '[name].[hash].bundle.js',
      publicPath: config.publicPath
    },

    module: {
      rules: [{
        test: /\.js$/,
        loader: 'babel-loader',
        options: {
          configFile: context.babelConfig
        }
      }, {
        test: /\.md$/,
        loader: 'wc-markdown-loader',
        options: {
          defaultStyle: false,
          shadowRoot: false,
          preset: { ...config.markdown }
        }
      }, {
        test: /\.css$/,
        exclude: new RegExp(`${config.themeFile}`),
        loaders: [
          { loader: 'css-to-string-loader' },
          ...commonCssLoaders
        ]
      }, {
        test: new RegExp(`${config.themeFile}`),
        loaders: [
          { loader: 'style-loader' },
          ...commonCssLoaders
        ]
      }, {
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'url-loader?limit=10000&mimetype=application/font-woff'
      }, {
        test: /\.(ttf|eot|svg|jpe?g|png|gif|otf)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'file-loader'
      }, {
        test: /\.(graphql|gql)$/,
        loader: 'graphql-tag/loader'
      }]
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
      }),

      ...mappedUserDirectoriesForWebpack,

      new CopyWebpackPlugin(userAssetsDirectoryForWebpack),

      new webpack.NormalModuleReplacementPlugin(
        /\.md/,
        (resource) => {
          resource.request = resource.request.replace(/^\.\//, context.pagesDir);
        }
      ),

      ...customWebpackPlugins
    ]
  };
};