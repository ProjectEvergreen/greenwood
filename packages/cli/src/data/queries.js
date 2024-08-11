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
// import { getQueryHash } from './common.js';

// const client = {
//   query: (params) => {
//     const { query, variables = {} } = params;

//     return fetch('http://localhost:4000/graphql', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Accept': 'application/json'
//       },
//       body: JSON.stringify({
//         query,
//         variables
//       })
//     }).then((response) => response.json());
//   }
// };

// const APOLLO_STATE = globalThis.__APOLLO_STATE__; // eslint-disable-line no-underscore-dangle
// const BASE_PATH = globalThis.__GWD_BASE_PATH__; // eslint-disable-line no-underscore-dangle
// const backupQuery = client.query;

// client.query = (params) => {
//   if (APOLLO_STATE) {
//     // __APOLLO_STATE__ defined, in production mode
//     const queryHash = getQueryHash(params.query, params.variables);
//     const cachePath = `${BASE_PATH}/${queryHash}-cache.json`;

//     return fetch(cachePath)
//       .then(response => response.json())
//       .then((response) => {
//         return {
//           data: response
//         };
//       });
//   } else {
//     // __APOLLO_STATE__ NOT defined, in development mode
//     return backupQuery(params);
//   }
// };

// export default client;