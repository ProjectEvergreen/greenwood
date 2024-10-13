const CONTENT_STATE = globalThis.__CONTENT_AS_DATA_STATE__ ?? false; // eslint-disable-line no-underscore-dangle
const PORT = globalThis?.__CONTENT_SERVER__?.PORT ?? 1985; // eslint-disable-line no-underscore-dangle
const BASE_PATH = globalThis?.__GWD_BASE_PATH__ ?? ''; // eslint-disable-line no-underscore-dangle

async function getContentAsData(key = '') {
  return CONTENT_STATE
    ? await fetch(`${window.location.origin}${BASE_PATH}/data-${key.replace(/\//g, '_')}.json`)
      .then(resp => resp.json())
    : await fetch(`http://localhost:${PORT}${BASE_PATH}/graph.json`, { headers: { 'X-CONTENT-KEY': key } })
      .then(resp => resp.json());
}

async function getContent() {
  return await getContentAsData('graph');
}

async function getContentByCollection(collection = '') {
  return await getContentAsData(`collection-${collection}`);
}

async function getContentByRoute(route = '') {
  return await getContentAsData(`route-${route}`);
}

export { getContent, getContentByCollection, getContentByRoute };