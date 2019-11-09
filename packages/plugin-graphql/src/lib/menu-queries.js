const ApolloClient = require('apollo-boost').ApolloClient;
const createHttpLink = require('apollo-link-http').createHttpLink;
const fetch = require('cross-fetch/polyfill').fetch;
const fs = require('fs-extra');
const { gql } = require('apollo-server-express');
const InMemoryCache = require('apollo-cache-inmemory').InMemoryCache;
const path = require('path');

/* Queries */
exports.getMenu = async (root, { name }, { graph }) => {
  const items = graph
    .filter((page) => page.menu === name)
    .map(async({ title, route }) => {
      return { path: route, name: title, items: [] };
    });

  return { name, items };
};

/* Extract cache server-side */
exports.createCache = async (req, { publicDir }) => {
  let cache = '';

  return new Promise(async(resolve, reject) => {
    try {
      const client = new ApolloClient({
        link: createHttpLink({
          uri: 'http://localhost:4000?q=internal', /* specific internal flag to prevent looping cache on request */
          fetch: fetch
        }),
        cache: new InMemoryCache()
      });

      /* Take the same query from request, and repeat the query for our server side cache */
      const { query, variables } = req.body;

      let { data } = await client.query({
        query: gql`${query}`,
        variables
      });

      if (data && data.getMenu) {
        cache = JSON.stringify(client.extract());

        /* Get the requests entire(full) route and rootRoute to use as reference for designated cache directory */
        const { origin, referer } = req.headers;
        const fullRoute = referer.substring(origin.length, referer.length);
        const rootRoute = fullRoute.substring(0, fullRoute.substring(1, fullRoute.length).indexOf('/') + 1);
        const target = path.join(publicDir, rootRoute);

        /* write new public folder if it doesn't exist then write new cache file */
        await fs.mkdirs(target, { recursive: true });
        await fs.writeFile(path.join(target, 'cache.json'), cache, 'utf8');
      }
      resolve();
    } catch (err) {
      console.log(err);
      reject(err);
    }
  });
};