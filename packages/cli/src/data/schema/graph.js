const { gql } = require('apollo-server-express');

const getDeriveMetaFromRoute = (route) => {
  const root = route.split('/')[1] || '';
  const label = root
    .replace('/', '')
    .replace('-', ' ')
    .split(' ')
    .map((word) => `${word.charAt(0).toUpperCase()}${word.substring(1)}`)
    .join(' ');

  return {
    label,
    root
  }; 
};

const getPagesFromGraph = async (root, query, context) => {
  const pages = [];
  const { graph } = context;

  graph
    .forEach(async(page) => {
      const { route } = page;
      const { label } = getDeriveMetaFromRoute(route);

      pages.push({
        title: label,
        link: route
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
      const { root, label } = getDeriveMetaFromRoute(route);

      if (root !== '' && !navigation[root]) {
        navigation[root] = {
          label,
          link: `/${root}/`
        };
      }
    });

  // TODO best format for users, hash map?
  return Object.keys(navigation).map((key) => {
    return navigation[key];
  });
};

const graphTypeDefs = gql`
  type Page {
    link: String
    title: String,
  }

  type Navigation {
    label: String,
    link: String
  }

  type Query {
    graph: [Page]
    navigation: [Navigation]
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