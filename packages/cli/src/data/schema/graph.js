const { gql } = require('apollo-server-express');

const graph = async (root, params, context) => {
  const pages = [];
  const { graph } = context;

  graph
    .forEach(async(node) => {
      const { title, route } = node;

      pages.push({
        path: route, 
        name: title
      });
    });

  return pages;
}; 

const graphTypeDef = gql`
  type Page {
    name: String
    path: String
  }

  type Query {
    graph: [Page]
  }
`;

const graphResolver = {
  Query: {
    graph
  }
};

module.exports = {
  graphTypeDef,
  graphResolver
};