const googleAnalyticsPlugin = require('../../../src/index');

module.exports = {
  plugins: [
    ...googleAnalyticsPlugin('UA-123456-1')
  ]
};