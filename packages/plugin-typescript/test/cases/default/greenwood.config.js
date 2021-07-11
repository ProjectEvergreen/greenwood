const pluginTypeScript = require('../../../src/index');

module.exports = {
  plugins: [
    ...pluginTypeScript()
  ]
};