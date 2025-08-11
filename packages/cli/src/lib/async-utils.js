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
// Constraint: mapper functions must not depend on each other
async function asyncMap(items, mapper) {
  const promises = [];

  for (const item of items) {
    promises.push(mapper(item));
  }

  return Promise.all(promises);
}

export { asyncFilter, asyncMap };
