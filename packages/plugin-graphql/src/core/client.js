import { getQueryHash } from '@greenwood/plugin-graphql/core/common';

const client = {
  query: (params) => {
    const { query, variables = {} } = params;

    return fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        query,
        variables
      })
    }).then((response) => response.json());
  }
};

const APOLLO_STATE = window.__APOLLO_STATE__; // eslint-disable-line no-underscore-dangle
const backupQuery = client.query;

client.query = (params) => {
  if (APOLLO_STATE) {
    // __APOLLO_STATE__ defined, in production mode
    const queryHash = getQueryHash(params.query, params.variables);
    const cachePath = `/${queryHash}-cache.json`;
    
    return fetch(cachePath)
      .then(response => response.json())
      .then((response) => {
        // mock client.query response
        return {
          data: response // new InMemoryCache().restore(response).readQuery(params)
        };
      });
  } else {
    // __APOLLO_STATE__ NOT defined, in development mode
    return backupQuery(params);
  }
};

export default client;

// import { ApolloClient } from 'apollo-client';
// import { InMemoryCache } from 'apollo-cache-inmemory';
// import { HttpLink } from 'apollo-link-http';
// import { getQueryHash } from '@greenwood/cli/data/common';

// const APOLLO_STATE = window.__APOLLO_STATE__; // eslint-disable-line no-underscore-dangle
// const client = new ApolloClient({
//   cache: new InMemoryCache(),
//   link: new HttpLink({
//     uri: 'http://localhost:4000'
//   })
// });
// const backupQuery = client.query;

// client.query = (params) => {
//   if (APOLLO_STATE) {
//     __APOLLO_STATE__ defined, in production mode
//     const queryHash = getQueryHash(params.query, params.variables);
//     const cachePath = `/${queryHash}-cache.json`;
    
//     return fetch(cachePath)
//       .then(response => response.json())
//       .then((response) => {
//         // mock client.query response
//         return {
//           data: new InMemoryCache().restore(response).readQuery(params)
//         };
//       });
//   } else {
//     // __APOLLO_STATE__ NOT defined, in development mode
//     return backupQuery(params);
//   }
// };

// export default client;