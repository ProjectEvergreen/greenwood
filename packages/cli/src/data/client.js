// TODO how to sync host and port with greenwood config
const host = 'localhost';
const port = 1985;

async function getContent() {
  return await fetch(`http://${host}:${port}/graph.json`)
    .then(resp => resp.json());
}

async function getContentByCollection(collection = '') {
  return (await fetch(`http://${host}:${port}/graph.json`)
    .then(resp => resp.json()))
    .filter(page => page?.data?.collection === collection);
}

async function getContentByRoute(route = '') {
  return (await fetch(`http://${host}:${port}/graph.json`)
    .then(resp => resp.json()))
    .filter(page => page?.route.startsWith(route));
}

export { getContent, getContentByCollection, getContentByRoute };