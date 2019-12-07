// TODO Top Level Navigation query
// TODO Sub navigation query
const { makeExecutableSchema } = require('apollo-server-express');
// const { helloTypeDef, helloResolver } = require('./hello');
const { graphTypeDefs, graphResolvers } = require('./graph');

const schema = makeExecutableSchema({
  typeDefs: [
    graphTypeDefs
    // helloTypeDef
  ],
  resolvers: Object.assign({}, 
    graphResolvers
    // helloResolver
  )
});

module.exports = schema;