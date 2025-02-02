const activeFrontmatterKeys = ["route", "label", "title", "id"];

function pruneGraph(pages) {
  return pages.map((page) => {
    const p = {
      ...page,
      title: page.title ?? page.label,
    };

    delete p.resources;
    delete p.imports;

    return p;
  });
}

function cleanContentCollection(collection = []) {
  return collection.map((page) => {
    let prunedPage = {};

    Object.keys(page).forEach((key) => {
      if ([...activeFrontmatterKeys, "data"].includes(key)) {
        prunedPage[key] = page[key];
      }
    });

    return {
      ...prunedPage,
      title: prunedPage.title || prunedPage.label,
    };
  });
}

function filterContentByCollection(graph, collection) {
  return graph.filter((page) => page?.data?.collection === collection);
}

function filterContentByRoute(graph, route) {
  return graph.filter((page) => page?.route.startsWith(route));
}

export {
  pruneGraph,
  activeFrontmatterKeys,
  cleanContentCollection,
  filterContentByCollection,
  filterContentByRoute,
};
