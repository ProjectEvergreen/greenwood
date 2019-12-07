// TODO Sub navigation query
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