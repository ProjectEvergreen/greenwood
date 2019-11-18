/* Queries */
exports.getMenu = async (root, { name }, { graph }) => {
  const items = graph
    .filter((page) => page.menu === name)
    .map(async({ title, route }) => {
      return { path: route, name: title, items: [] };
    });

  return { name, items };
};