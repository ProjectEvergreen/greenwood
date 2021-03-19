const pluginGraphQL = require('../../../src/index');

module.exports = {
  title: 'GraphQL ConfigQuery Spec',
  
  plugins: [
    ...pluginGraphQL()
  ]

};