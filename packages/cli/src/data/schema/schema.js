const { makeExecutableSchema } = require('apollo-server-express');
const { configTypeDefs, configResolvers } = require('./config');
const { graphTypeDefs, graphResolvers } = require('./graph');

const mergedResolvers = Object.assign({}, {
  Query: {
    ...configResolvers.Query,
    ...graphResolvers.Query
  }
});

const schema = makeExecutableSchema({
  typeDefs: [
    configTypeDefs,
    graphTypeDefs
  ],
  resolvers: [
    mergedResolvers
  ]
});

module.exports = schema;