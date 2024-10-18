const activeFrontmatterKeys = ['route', 'label', 'title', 'id'];

function cleanContentCollection(collection = []) {
  return collection.map((page) => {
    let prunedPage = {};

    Object.keys(page).forEach((key) => {
      if ([...activeFrontmatterKeys, 'data'].includes(key)) {
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
  activeFrontmatterKeys,
  cleanContentCollection
};