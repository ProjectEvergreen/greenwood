const CopyWebpackPlugin = require('copy-webpack-plugin'); // part of @greeenwood/cli
const path = require('path');

module.exports = () => {
  const filename = 'webcomponents-loader.js';
  const nodeModuleRoot = 'node_modules/@webcomponents/webcomponentsjs';

  return [{
    type: 'index',
    provider: () => {
      return {
        hookGreenwoodPolyfills: `
          <!-- Web Components poyfill -->
          <script src="/${filename}"></script>
        `
      };
    }
  }, {
    type: 'webpack',
    provider: (compilation) => {
      const cwd = process.cwd();
      const { publicDir } = compilation.context;
    
      return new CopyWebpackPlugin([{
        from: path.join(cwd, nodeModuleRoot, filename),
        to: publicDir
      }, {
        context: path.join(cwd, nodeModuleRoot),
        from: 'bundles/*.js',
        to: publicDir
      }]);
    }
  }];
};