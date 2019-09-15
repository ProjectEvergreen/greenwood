// const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = () => {
  return [{
    type: 'index',
    provider: () => {
      return {
        hookGreenwoodPolyfills: `
          <!-- Web Components poyfill for IE11 and Edge -->
          <script src="//cdnjs.cloudflare.com/ajax/libs/webcomponentsjs/2.2.7/webcomponents-bundle.js"></script>
        `
      };
    }
  }];
};