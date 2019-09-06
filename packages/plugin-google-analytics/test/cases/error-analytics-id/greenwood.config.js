const googleAnalyticsPlugin = require('../../../src/index');

module.exports = {
  plugins: [
    ...googleAnalyticsPlugin()
  ]
};