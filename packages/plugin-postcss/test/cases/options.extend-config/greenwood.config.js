const pluginPostCss = require('../../../src/index');

module.exports = {
  plugins: [
    pluginPostCss({
      extendConfig: true
    })
  ]
};