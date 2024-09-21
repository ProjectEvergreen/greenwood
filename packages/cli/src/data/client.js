// TODO how to sync host and port with greenwood config
const host = 'localhost';
const port = 1985;

async function getContent() {
  return (await fetch(`http://${host}:${port}/graph.json`)
    .then(resp => resp.json()))
    .map((page) => {
      return {
        ...page,
        title: page.title || page.label
      };
    });
}

async function getContentByCollection(collection = '') {
  return (await fetch(`http://${host}:${port}/graph.json`)
    .then(resp => resp.json()))
    .filter(page => page?.data?.collection === collection)
    .map((page) => {
      return {
        ...page,
        title: page.title || page.label
      };
    });
}

async function getContentByRoute(route = '') {
  return (await fetch(`http://${host}:${port}/graph.json`)
    .then(resp => resp.json()))
    .filter(page => page?.route.startsWith(route))
    .map((page) => {
      return {
        ...page,
        title: page.title || page.label
      };
    });
}

export { getContent, getContentByCollection, getContentByRoute };