const { gql } = require('apollo-server-express');
// const { getMenu } = require('./queries');

const graph = (root, { graph }) => {
  return graph;
  // .filter((page) => page.menu === name)
  // .map(({ title, route }) => {
  //   return { path: route, name: title, items: [] };
  // });
}; 

exports.graphTypeDef = gql`
  # type Page {
  #   name: String!
  #   path: String!
  #   items: [MenuItem]
  # }

  # type Pages {
  #   name: String!
  #   path: String!
  #   items: [SubMenuItem]
  # }

  # type SubMenuItem {
  #   name: String!
  #   id: String!
  # }

  type GraphQuery {
    graph
  }
`;

exports.graphResolver = {
  GraphQuery: {
    graph
  }
}; 