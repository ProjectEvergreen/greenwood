const pluginBabel = require('../../../src/index');
const pluginCommonJs = require('../../../../plugin-import-commonjs/src/index');

module.exports = {
  plugins: [
    ...pluginBabel({
      extendConfig: true
    }),
    ...pluginCommonJs() // TODO make this go away???
  ]
};