const pluginImportJson = require('../../../src/index');

module.exports = {
  plugins: [
    ...pluginImportJson()
  ]
};