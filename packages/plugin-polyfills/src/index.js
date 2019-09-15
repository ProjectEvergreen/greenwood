const CopyWebpackPlugin = require('copy-webpack-plugin'); // part of @greeenwood/cli
const path = require('path');

module.exports = () => {
  const filename = 'webcomponents-bundle.js';

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
      return new CopyWebpackPlugin([{
        from: path.join(process.cwd(), `node_modules/@webcomponents/webcomponentsjs/${filename}`),
        to: compilation.context.publicDir
      }]);
    }
  }];
};