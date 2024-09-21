const host = 'localhost';
const port = globalThis?.__CONTENT_SERVER__?.PORT ?? 1985; // eslint-disable-line no-underscore-dangle
const endpoint = `http://${host}:${port}`;

async function getContent() {
  return await fetch(`${endpoint}/graph.json`)
    .then(resp => resp.json());
}

async function getContentByCollection(collection = '') {
  return (await fetch(`${endpoint}/graph.json`)
    .then(resp => resp.json()))
    .filter(page => page?.data?.collection === collection);
}

async function getContentByRoute(route = '') {
  return (await fetch(`${endpoint}/graph.json`)
    .then(resp => resp.json()))
    .filter(page => page?.route.startsWith(route));
}

export { getContent, getContentByCollection, getContentByRoute };