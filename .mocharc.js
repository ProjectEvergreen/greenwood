const path = require('path');

module.exports = {
  // TODO spec: path.join(__dirname, 'packages/**/test/**/**/**/*.spec.js'),
  spec: path.join(__dirname, 'packages/**/test/cases/**/**/*.spec.js'),
  timeout: 30000
};