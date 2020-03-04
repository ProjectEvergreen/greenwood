const { makeExecutableSchema } = require('apollo-server-express');
const { helloTypeDefs, helloResolvers } = require('./hello');
const { graphTypeDefs, graphResolvers } = require('./graph');

const mergedResolvers = Object.assign({}, {
  Query: {
    ...graphResolvers.Query,
    ...helloResolvers.Query
  }
});

const schema = makeExecutableSchema({
  typeDefs: [
    helloTypeDefs,
    graphTypeDefs
  ],
  resolvers: [
    mergedResolvers
  ]
});

module.exports = schema;