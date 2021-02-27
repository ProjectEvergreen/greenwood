const pluginImportCss = require('../../../src/index');

module.exports = {
  plugins: [
    ...pluginImportCss()
  ]
};