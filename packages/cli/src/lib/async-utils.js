// https://stackoverflow.com/a/76974728/417806
async function asyncFilter(arr, cb) {
  const filtered = [];

  for (const element of arr) {
    const needAdd = await cb(element);

    if (needAdd) {
      filtered.push(element);
    }
  }

  return filtered;
}

// https://stackoverflow.com/a/71278238/417806
async function asyncMap(items, mapper) {
  const mappedItems = [];

  for (const item of items) {
    mappedItems.push(await mapper(item));
  }

  return mappedItems;
}

export { asyncFilter, asyncMap };
