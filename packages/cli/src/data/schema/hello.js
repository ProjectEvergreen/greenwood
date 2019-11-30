const { gql } = require('apollo-server');

const helloTypeDef = gql`
  type Query {
    hello: String
  }
`;

const helloResolver = {
  Query: {
    hello: () => 'Hello world!'
  }
};

module.exports = {
  helloTypeDef,
  helloResolver
};