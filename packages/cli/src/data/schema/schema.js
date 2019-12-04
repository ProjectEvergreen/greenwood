// TODO Top Level Navigation query
// TODO Sub navigation query
// TODO all pages (sitemap?) query
const { makeExecutableSchema } = require('apollo-server-express');
// const { helloTypeDef, helloResolver } = require('./hello');
const { graphTypeDef, graphResolver } = require('./graph');

const schema = makeExecutableSchema({
  typeDefs: [
    graphTypeDef
    // helloTypeDef
  ],
  resolvers: Object.assign({}, 
    graphResolver
    // helloResolver
  )
});

module.exports = schema;