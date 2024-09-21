const activeGreenwoodFrontmatterKeys = ['route', 'label', 'title', 'id'];

function cleanContentCollection(collection = []) {
  return collection.map((page) => {
    let prunedPage = {};

    Object.keys(page).forEach((key) => {
      if ([...activeGreenwoodFrontmatterKeys, 'data'].includes(key)) {
        prunedPage[key] = page[key];
      }
    });

    return {
      ...prunedPage,
      title: prunedPage.title || prunedPage.label
    };
  });
}

export {
  activeGreenwoodFrontmatterKeys,
  cleanContentCollection
};