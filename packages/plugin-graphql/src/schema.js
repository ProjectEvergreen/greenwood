const { gql } = require('apollo-server-express');
const { merge } = require('lodash');

const { menuTypeDefs, menuResolvers } = require('./schemas/menu-schema');

exports.typeDefs = gql`
  ${menuTypeDefs}
`;

exports.resolvers = merge(
  menuResolvers,
);
