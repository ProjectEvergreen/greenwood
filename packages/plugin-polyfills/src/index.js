const CopyWebpackPlugin = require('copy-webpack-plugin'); // part of @greeenwood/cli
const path = require('path');

module.exports = () => {
  const loaderFilename = 'webcomponents-loader.js';
  const es5Adapter = 'custom-elements-es5-adapter.js';
  const nodeModuleRoot = 'node_modules/@webcomponents/webcomponentsjs';

  return [{
    type: 'index',
    provider: () => {
      return {
        hookGreenwoodPolyfills: `
          <!-- ES5 Adapter  -->
          <!-- <script src="/${es5Adapter}"></script> -->

          <!-- Web Components poyfill -->
          <script src="/${loaderFilename}"></script>
        `
      };
    }
  }, {
    type: 'webpack',
    provider: (compilation) => {
      const cwd = process.cwd();
      const { publicDir } = compilation.context;
    
      return new CopyWebpackPlugin([{
        from: path.join(cwd, nodeModuleRoot, loaderFilename),
        to: publicDir
      }, {
        from: path.join(cwd, nodeModuleRoot, es5Adapter),
        to: publicDir
      }, {
        context: path.join(cwd, nodeModuleRoot),
        from: 'bundles/*.js',
        to: publicDir
      }]);
    }
  }];
};