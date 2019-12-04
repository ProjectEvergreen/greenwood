const { gql } = require('apollo-server-express');

// TODO name needed?
const graph = async (root, { name }, { graph }) => { // eslint-disable-line no-unused-vars
  const pages = [];

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