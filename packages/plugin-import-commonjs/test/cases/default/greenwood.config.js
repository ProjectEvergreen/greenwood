const pluginImportCommonJs = require('../../../src/index');

module.exports = {
  plugins: [
    ...pluginImportCommonJs()
  ]
};