import gql from 'graphql-tag';

const getMenuFromGraph = async (root, { name, pathname, orderBy }, context) => {
  const { graph } = context;
  const { basePath } = context.config;
  let items = [];

  graph
    .forEach((page) => {
      const { route, data, label } = page;
      const { menu, index, tableOfContents, linkheadings } = data;
      let children = getParsedHeadingsFromPage(tableOfContents, linkheadings);

      if (menu && menu.search(name) > -1) {
        if (pathname) {
          const normalizedRoute = basePath === ''
            ? route
            : route.replace(basePath, '');

          if (normalizedRoute.startsWith(pathname)) {
            items.push({ item: { route, label, index }, children });
          }
        } else {
          items.push({ item: { route, label, index }, children });
        }
      }
    });

  if (orderBy !== '') {
    items = sortMenuItems(items, orderBy);
  }

  return Promise.resolve({ item: { label: name }, children: items });
};

const sortMenuItems = (menuItems, order) => {
  const compare = (a, b) => {
    if (order === 'title_asc' || order === 'title_desc') {
      a = a.item.label, b = b.item.label;
    }
    if (order === 'index_asc' || order === 'index_desc') {
      a = a.item.index, b = b.item.index;
    }
    if (order === 'title_asc' || order === 'index_asc') {
      if (a < b) {
        return -1;
      }
      if (a > b) {
        return 1;
      }
    } else if (order === 'title_desc' || order === 'index_desc') {
      if (a > b) {
        return -1;
      }
      if (a < b) {
        return 1;
      }
    }
    return 0;
  };

  menuItems.sort(compare);
  return menuItems;
};

const getParsedHeadingsFromPage = (tableOfContents = [], headingLevel) => {
  let children = [];

  if (tableOfContents.length > 0 && headingLevel > 0) {
    tableOfContents.forEach(({ content, slug, lvl }) => {
      // make sure we only add heading elements of the same level (h1, h2, h3)
      if (lvl === headingLevel) {
        children.push({ item: { label: content, route: '#' + slug }, children: [] });
      }
    });
  }
  return children;
};

const getPagesFromGraph = async (root, query, context) => {
  return Promise.resolve(context.graph);
};

const getChildrenFromParentRoute = async (root, query, context) => {
  const pages = [];
  const { parent } = query;
  const { graph } = context;
  const { basePath } = context.config;

  graph
    .forEach((page) => {
      const { route, path } = page;
      const normalizedRoute = basePath === ''
        ? route
        : route.replace(basePath, '/');
      const root = normalizedRoute.split('/')[1];

      if (`/${root}` === parent && path.indexOf(`${parent}/index.md`) < 0) {
        pages.push(page);
      }
    });

  return Promise.resolve(pages);
};

const graphTypeDefs = gql`
  type Page {
    data: Data,
    filename: String,
    id: String,
    label: String,
    path: String,
    outputPath: String,
    route: String,
    template: String,
    title: String
  }

  type Link {
    label: String,
    route: String
  }

  type Menu {
    item: Link
    children: [Menu]
  }

  enum MenuOrderBy {
    title_asc,
    title_desc
    index_asc,
    index_desc
  }

  type Query {
    graph: [Page]
    menu(name: String, orderBy: MenuOrderBy, pathname: String): Menu
    children(parent: String): [Page]
  }
`;

const graphResolvers = {
  Query: {
    graph: getPagesFromGraph,
    menu: getMenuFromGraph,
    children: getChildrenFromParentRoute
  }
};

export {
  graphTypeDefs,
  graphResolvers
};