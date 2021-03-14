const pluginGraphQL = require('../../../src/index');

module.exports = {
    
  plugins: [
    ...pluginGraphQL()
  ]

};