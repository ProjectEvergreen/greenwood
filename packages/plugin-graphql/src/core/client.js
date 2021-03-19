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
        return {
          data: response
        };
      });
  } else {
    // __APOLLO_STATE__ NOT defined, in development mode
    return backupQuery(params);
  }
};

export default client;