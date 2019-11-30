// TODO Top Level Navigation query
// TODO Sub navigation query
// TODO all pages (sitemap?) query
const { makeExecutableSchema } = require('apollo-server-express');
const { helloTypeDef, helloResolver } = require('./hello');
// const { graphTypeDef, graphResolver } = require('./graph');

const schema = makeExecutableSchema({
  typeDefs: [
    helloTypeDef
  ],
  resolvers: Object.assign({}, 
    helloResolver
  )
});

module.exports = schema;