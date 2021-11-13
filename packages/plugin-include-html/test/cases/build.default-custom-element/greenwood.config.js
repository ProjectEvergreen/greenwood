const pluginIncludeHtml = require('../../../src/index');

module.exports = {
  plugins: [
    ...pluginIncludeHtml()
  ]
};