const { gql } = require('apollo-server-express');

const getDeriveMetaFromRoute = (route) => {
  console.log('getDeriveMetaFromRoute route', route);
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
  console.log('getPagesFromGraph root', root);
  console.log('getPagesFromGraph query', query);
  console.log('getPagesFromGraph context', context);
  const pages = [];
  const { graph } = context;

  graph
    .forEach((page) => {
      const { route, mdFile, fileName, template } = page;
      const id = page.label;
      const { label } = getDeriveMetaFromRoute(route);

      pages.push({
        id,
        filePath: mdFile,
        fileName,
        template,
        title: label,
        link: route
      });
    });

  return pages;
};

const getNavigationFromGraph = async (root, query, context) => {
  console.log('getNavigationFromGraph root', root);
  console.log('getNavigationFromGraph query', query);
  console.log('getNavigationFromGraph context', context);
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

  // TODO best format for users, hash map? #271
  return Object.keys(navigation).map((key) => {
    return navigation[key];
  });
};

const getChildrenFromParentRoute = async (root, query, context) => {
  console.log('getChildrenFromParentRoute root', root);
  console.log('getChildrenFromParentRoute query', query);
  console.log('getChildrenFromParentRoute context', context);
  
  const pages = [];
  const { parent } = query;
  const { graph } = context;

  graph
    .forEach((page) => {
      const { route, mdFile, fileName, template } = page;
      const root = route.split('/')[1];

      if (root.indexOf(parent) >= 0) {
        const { label } = getDeriveMetaFromRoute(route);
        const id = page.label;

        pages.push({
          id,
          filePath: mdFile,
          fileName,
          template,
          title: label,
          link: route
        });
      }
    });
  
  return pages;
};

const graphTypeDefs = gql`
  type Page {
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