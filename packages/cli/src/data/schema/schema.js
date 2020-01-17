// TODO merging resolvers not actually working, resolve as part of #21 or #270
const { makeExecutableSchema } = require('apollo-server-express');
const { helloTypeDefs, helloResolvers } = require('./hello');
const { graphTypeDefs, graphResolvers } = require('./graph');

const schema = makeExecutableSchema({
  typeDefs: [
    graphTypeDefs,
    helloTypeDefs
  ],
  resolvers: Object.assign({}, 
    graphResolvers,
    helloResolvers
  )
});

module.exports = schema;