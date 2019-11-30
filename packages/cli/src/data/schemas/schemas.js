// TODO Top Level Navigation schema
// TODO Sub navigation schema
// TODO all pages (sitemap?) schema

const { gql } = require('apollo-server');

const typeDefs = gql`
  type Query {
    hello: String
  }
`;

const resolvers = {
  Query: {
    hello: () => 'Hello world!'
  }
};

module.exports.typeDefs = typeDefs;
module.exports.resolvers = resolvers;