const googleAnalyticsPlugin = require('../../../src/index');

module.exports = {
  plugins: [
    ...googleAnalyticsPlugin({
      analyticsId: 'UA-123456-1',
      anonymous: false
    })
  ]
};