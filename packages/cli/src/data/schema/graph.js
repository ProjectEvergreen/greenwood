const { gql } = require('apollo-server-express');

const getDeriveMetaFromRoute = (route) => {
  // TODO hardcoded root / depth - #273
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
    .forEach((page) => {
      const { route, mdFile, fileName, template, title, data } = page;
      const { label } = getDeriveMetaFromRoute(route);
      const id = page.label;

      pages.push({
        id,
        filePath: mdFile,
        fileName,
        template,
        title: title !== '' ? title : label,
        link: route,
        data: {
          ...data
        }
      });
    });

  return pages;
};

const getNavigationFromGraph = async (root, query, context) => {
  const navigation = {};
  const { graph } = context;

  graph
    .forEach((page) => {
      const { route } = page;
      const { root, label } = getDeriveMetaFromRoute(route);

      if (root !== '' && !navigation[root]) {
        navigation[root] = {
          label,
          link: `/${root}/`
        };
      }
    });

  // TODO best format for users, hash map? #288
  return Object.keys(navigation).map((key) => {
    return navigation[key];
  });
};

const getChildrenFromParentRoute = async (root, query, context) => {
  const pages = [];
  const { parent } = query;
  const { graph } = context;

  graph
    .forEach((page) => {
      const { route, mdFile, fileName, template, title, data } = page;
      const { label } = getDeriveMetaFromRoute(route);
      const root = route.split('/')[1];

      if (root.indexOf(parent) >= 0) {
        const id = page.label;

        pages.push({
          id,
          filePath: mdFile,
          fileName,
          template,
          title: title !== '' ? title : label,
          link: route,
          data: {
            ...data
          }
        });
      }
    });
  
  return pages;
};

const graphTypeDefs = gql`
  type Data {
    date: String
  }

  type Page {
    data: Data,
    id: String,
    filePath: String,
    fileName: String,
    template: String,
    link: String,
    title: String
  }

  type Navigation {
    label: String,
    link: String
  }

  type Query {
    graph: [Page]
    navigation: [Navigation]
    children(parent: String): [Page]
  }
`;

const graphResolvers = {
  Query: {
    graph: getPagesFromGraph,
    navigation: getNavigationFromGraph,
    children: getChildrenFromParentRoute
  }
};

module.exports = {
  graphTypeDefs,
  graphResolvers
};