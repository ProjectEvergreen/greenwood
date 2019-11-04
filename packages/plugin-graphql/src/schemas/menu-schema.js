const { gql } = require('apollo-server-express');
const {
  getMenu
} = require('../lib/menu-queries');

exports.menuTypeDefs = gql`
  type Menu {
    name: String!
    path: String!
    items: [MenuItem]
  }

  type MenuItem {
    name: String!
    path: String!
    items: [SubMenuItem]
  }

  type SubMenuItem {
    name: String!
    id: String!
  }

  type Query {
    getMenu(name: String!): Menu
  }
`;

exports.menuResolvers = {
  Query: {
    getMenu
  }
};
