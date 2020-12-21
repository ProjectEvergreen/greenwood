const sassTransformPlugin = require('../../../src/index');

module.exports = {
  plugins: [
    ...sassTransformPlugin()
  ]
};