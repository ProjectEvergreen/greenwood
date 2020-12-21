const preProcessHTMLTransformPlugin = require('../../../src/index');

module.exports = {
  plugins: [
    ...preProcessHTMLTransformPlugin()
  ]
};