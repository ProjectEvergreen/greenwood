import gql from 'graphql-tag';

const getCollection = (root, { name, orderBy }, context) => {
  const { graph } = context;
  let items = [];

  graph
    .forEach((page) => {
      const { data, label, title } = page;
      const { collection, tableOfContents, tocHeading } = data;
      const toc = getParsedHeadingsFromPage(tableOfContents, tocHeading);

      if (collection === name) {
        items.push({ ...page, title: title || label, tableOfContents: toc });
      }
    });

  if (orderBy) {
    items = sortCollection(items, orderBy);
  }

  return items;
};

const sortCollection = (collection, orderBy) => {
  const compare = (a, b) => {
    if (orderBy === 'title_asc' || orderBy === 'title_desc') {
      a = a?.title, b = b?.title;
    }
    if (orderBy === 'order_asc' || orderBy === 'order_desc') {
      a = a?.data.order, b = b?.data?.order;
    }
    if (orderBy === 'title_asc' || orderBy === 'order_asc') {
      if (a < b) {
        return -1;
      }
      if (a > b) {
        return 1;
      }
    } else if (orderBy === 'title_desc' || orderBy === 'order_desc') {
      if (a > b) {
        return -1;
      }
      if (a < b) {
        return 1;
      }
    }
    return 0;
  };

  return collection.sort(compare);
};

const getParsedHeadingsFromPage = (tableOfContents = [], headingLevel) => {
  let children = [];

  if (tableOfContents.length > 0 && headingLevel > 0) {
    tableOfContents.forEach(({ content, slug, lvl }) => {
      // make sure we only add heading elements of the same level (h1, h2, h3)
      if (lvl === headingLevel) {
        children.push({ label: content, route: '#' + slug });
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
  // TODO handle base path
  // const { basePath } = context.config;

  graph
    .forEach((page) => {
      const { route } = page;

      if (`${parent}/` !== route && route.startsWith(parent)) {
        pages.push(page);
      }
    });

  return Promise.resolve(pages);
};

const graphTypeDefs = gql`
  type TocItem {
    label: String,
    route: String,
  }

  type Page {
    id: String,
    label: String,
    title: String,
    route: String,
    layout: String,
    data: Data,
    outputPath: String,
    workspacePath: String,
    tableOfContents: [TocItem]
  }

  enum CollectionOrderBy {
    title_asc,
    title_desc
    order_asc,
    order_desc
  }

  type Query {
    graph: [Page]
    collection(name: String!, orderBy: CollectionOrderBy): [Page]
    children(parent: String!): [Page]
  }
`;

const graphResolvers = {
  Query: {
    graph: getPagesFromGraph,
    collection: getCollection,
    children: getChildrenFromParentRoute
  }
};

export {
  graphTypeDefs,
  graphResolvers
};