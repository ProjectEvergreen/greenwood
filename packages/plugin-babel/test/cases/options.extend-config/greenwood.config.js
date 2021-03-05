const pluginBabel = require('../../../src/index');

module.exports = {
  plugins: [
    ...pluginBabel({
      extendConfig: true
    })
  ]
};