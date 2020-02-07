const { gql } = require('apollo-server-express');

const getMenuFromGraph = async (root, { pathname, filter = '' }, context) => {
  const { graph } = context;
  let items = [];

  // TODO: Issue #271 sorting ascending/descending label/index
  // https://github.com/ProjectEvergreen/greenwood/issues/271
  graph
    .forEach((page) => {
      const { route, menu, title, tableOfContents } = page;
      let children = [];

      if (menu && menu.search(filter) > -1) {

        if (menu === 'side') {
          // check we're querying only pages that contain base route
          let baseRouteIndex = pathname.substring(1, pathname.length).indexOf('/');
          let baseRoute = pathname.substring(0, baseRouteIndex + 1);

          if (route.includes(baseRoute)) {
            if (tableOfContents.length > 0) {
              children = tableOfContents.map(({ content, slug }) => {
                return { item: { label: content, link: '#' + slug }, children: [] };
              });
            }
            items.push({ item: { link: route, label: title }, children });
          }
        } else {
          items.push({ item: { link: route, label: title }, children });
        }
      }
    });

  return { label: menu, link: 'na', children: items };
};

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

const getChildrenFromParentRoute = async (root, query, context) => {
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

  type Link {
    label: String,
    link: String
  }

  type Menu {
    item: Link
    children: [Menu]
  }

  type Query {
    graph: [Page]
    menu(filter: String, pathname: String, orderBy: MenuOrderBy): Menu
    children(parent: String): [Page]
  }

  enum MenuOrderBy {
    label_asc,
    label_desc
    index_asc,
    index_desc
  }
`;

const graphResolvers = {
  Query: {
    graph: getPagesFromGraph,
    menu: getMenuFromGraph,
    children: getChildrenFromParentRoute
  }
};

module.exports = {
  graphTypeDefs,
  graphResolvers
};