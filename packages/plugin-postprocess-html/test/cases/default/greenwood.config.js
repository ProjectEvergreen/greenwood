const postProcessHTMLTransformPlugin = require('../../../src/index');

module.exports = {
  plugins: [
    ...postProcessHTMLTransformPlugin()
  ]
};