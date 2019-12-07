const { gql } = require('apollo-server');

const helloTypeDefs = gql`
  type HelloQuery {
    hello: String
  }
`;

const helloResolvers = {
  HelloQuery: {
    hello: () => 'Hello world!'
  }
};

module.exports = {
  helloTypeDefs,
  helloResolvers
};