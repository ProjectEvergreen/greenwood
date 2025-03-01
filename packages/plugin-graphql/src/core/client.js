import { getQueryHash } from "./common.js";

/**
 * @returns {import("../types/index.d.ts").Client} - Greenwood's read-only Apollo client
 */
const client = {
  query: (params) => {
    const { query, variables = {} } = params;

    return fetch("http://localhost:4000/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    }).then((response) => response.json());
  },
};

const APOLLO_STATE = globalThis.__APOLLO_STATE__;
const BASE_PATH = globalThis.__GWD_BASE_PATH__;
const backupQuery = client.query;

client.query = (params) => {
  if (APOLLO_STATE) {
    // __APOLLO_STATE__ defined, in production mode
    const queryHash = getQueryHash(params.query, params.variables);
    const cachePath = `${BASE_PATH}/${queryHash}-cache.json`;

    return fetch(cachePath)
      .then((response) => response.json())
      .then((response) => {
        return {
          data: response,
        };
      });
  } else {
    // __APOLLO_STATE__ NOT defined, in development mode
    return backupQuery(params);
  }
};

export default client;
