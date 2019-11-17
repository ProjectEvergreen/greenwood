const { gql } = require('apollo-server-express');

const { menuTypeDefs, menuResolvers } = require('./schemas/menu-schema');

exports.typeDefs = gql`
  ${menuTypeDefs}
`;

exports.resolvers = Object.assign(
  menuResolvers,
);
