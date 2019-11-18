const { gql } = require('apollo-server-express');

const { menuTypeDefs, menuResolvers } = require('./menu-schema');

// eventually it will loop through and merge plugin schemas
exports.typeDefs = gql`
  ${menuTypeDefs}
`;

exports.resolvers = Object.assign(
  menuResolvers,
);
