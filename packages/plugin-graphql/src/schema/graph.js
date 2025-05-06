import gql from "graphql-tag";
import {
  filterContentByCollection,
  filterContentByRoute,
} from "@greenwood/cli/src/lib/content-utils.js";

const getCollection = async (root, { name, orderBy }, context) => {
  const { graph } = context;
  const content = filterContentByCollection(graph, name);
  let items = [];

  content.forEach((page) => {
    const { data, label, title } = page;
    const { tableOfContents, tocHeading } = data;
    const toc = getParsedHeadingsFromPage(tableOfContents, tocHeading);

    items.push({ ...page, title: title || label, tableOfContents: toc });
  });

  if (orderBy) {
    return sortCollection(items, orderBy);
  }

  return items;
};

const sortCollection = (collection, orderBy) => {
  const compare = (a, b) => {
    if (orderBy === "title_asc" || orderBy === "title_desc") {
      (a = a?.title), (b = b?.title);
    }
    if (orderBy === "order_asc" || orderBy === "order_desc") {
      (a = a?.data.order), (b = b?.data?.order);
    }
    if (orderBy === "title_asc" || orderBy === "order_asc") {
      if (a < b) {
        return -1;
      }
      if (a > b) {
        return 1;
      }
    } else if (orderBy === "title_desc" || orderBy === "order_desc") {
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

const getParsedHeadingsFromPage = (tableOfContents = []) => {
  let children = [];

  tableOfContents.forEach(({ content, slug }) => {
    children.push({ label: content, route: "#" + slug });
  });

  return children;
};

const getPagesFromGraph = async (root, query, context) => {
  return context.graph;
};

const getChildrenFromParentRoute = async (root, query, context) => {
  const { parent } = query;

  return filterContentByRoute(context.graph, parent);
};

const graphTypeDefs = gql`
  type TocItem {
    label: String
    route: String
  }

  type Page {
    id: String
    label: String
    title: String
    route: String
    layout: String
    data: Data
    tableOfContents: [TocItem]
  }

  enum CollectionOrderBy {
    title_asc
    title_desc
    order_asc
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
    children: getChildrenFromParentRoute,
  },
};

export { graphTypeDefs, graphResolvers };
