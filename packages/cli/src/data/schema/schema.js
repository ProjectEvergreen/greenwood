const { makeExecutableSchema } = require('apollo-server-express');
const { configTypeDefs, configResolvers } = require('./config');
const { graphTypeDefs, graphResolvers } = require('./graph');
const { helloTypeDefs, helloResolvers } = require('./hello');

const mergedResolvers = Object.assign({}, {
  Query: {
    ...configResolvers.Query,
    ...graphResolvers.Query,
    ...helloResolvers.Query
  }
});

const schema = makeExecutableSchema({
  typeDefs: [
    configTypeDefs,
    graphTypeDefs,
    helloTypeDefs
  ],
  resolvers: [
    mergedResolvers
  ]
});

module.exports = schema;