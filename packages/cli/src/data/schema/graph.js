const { gql } = require('apollo-server-express');

const getTitleFromRoute = (route) => {
  const root = route.split('/')[1] || '';
  const title = root
    .replace('/', '')
    .replace('-', ' ')
    .split(' ')
    .map((word) => `${word.charAt(0).toUpperCase()}${word.substring(1)}`)
    .join(' ');

  return {
    title,
    root
  }; 
};

const getPagesFromGraph = async (root, query, context) => {
  const pages = [];
  const { graph } = context;

  graph
    .forEach(async(page) => {
      const { route } = page;

      pages.push({
        path: route, 
        title: getTitleFromRoute(route).title
      });
    });

  return pages;
};

const getNavigationFromGraph = async (root, query, context) => {
  const navigation = {};
  const { graph } = context;

  graph
    .forEach(async(page) => {
      const { route } = page;
      const root = getTitleFromRoute(route).root;

      if (root !== '' && !navigation[root]) {
        navigation[root] = {
          title: getTitleFromRoute(route).title,
          path: `/${root}/`
        };
      }
    });

  // TODO best format for users, hash map?
  return Object.keys(navigation).map((key) => {
    return navigation[key];
  });
}; 

// TODO fully define Page schema definition
const graphTypeDefs = gql`
  type Page {
    path: String
    title: String
  }

  type Navigation {
    label: String
    page: Page
  }

  type Query {
    graph: [Page]
    navigation: [Page]
  }
`;

const graphResolvers = {
  Query: {
    graph: getPagesFromGraph,
    navigation: getNavigationFromGraph
  }
};

module.exports = {
  graphTypeDefs,
  graphResolvers
};