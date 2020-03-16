const path = require('path');

module.exports = {
  spec: path.join(__dirname, 'packages/**/test/**/**/**/*.spec.js'),
  timeout: 30000
};