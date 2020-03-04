const { gql } = require('apollo-server');

const helloTypeDefs = gql`
  extend type Query {
    hello: String
  }
`;

const helloResolvers = {
  Query: {
    hello: () => 'Hello world!'
  }
};

module.exports = {
  helloTypeDefs,
  helloResolvers
};