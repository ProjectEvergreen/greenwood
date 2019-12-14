const { ApolloClient } = require('apollo-client');
const createHttpLink = require('apollo-link-http').createHttpLink;
const fetch = require('node-fetch');
const fs = require('fs-extra');
const { gql } = require('apollo-server');
const InMemoryCache = require('apollo-cache-inmemory').InMemoryCache;
const path = require('path');

/* Extract cache server-side */
module.exports = async (req, context) => {

  return new Promise(async(resolve, reject) => {
    try {
      const client = await new ApolloClient({
        link: createHttpLink({
          uri: 'http://localhost:4000?q=internal', /* internal flag to prevent looping cache on request */
          fetch
        }),
        cache: new InMemoryCache()
      });

      /* Take the same query from request, and repeat the query for our server side cache */
      const { query, variables } = req.body;

      let { data } = await client.query({
        query: gql`${query}`,
        variables
      });

      if (data) {
        const cache = JSON.stringify(client.extract());

        /* Get the requests entire (full) route and rootRoute to use as reference for designated cache directory */
        const { origin, referer } = req.headers;
        const fullRoute = referer.substring(origin.length, referer.length);
        const rootRoute = fullRoute.substring(0, fullRoute.substring(1, fullRoute.length).indexOf('/') + 1);
        const target = path.join(context.publicDir, rootRoute);

        /* write new public folder if it doesn't exist then write new cache file */
        // TODO merge existing cache, if present
        await fs.mkdirs(target, { recursive: true });
        await fs.writeFile(path.join(target, 'cache.json'), cache, 'utf8');
      }
      resolve();
    } catch (err) {
      console.error('create cache error', err);
      reject(err);
    }
  });
}; 