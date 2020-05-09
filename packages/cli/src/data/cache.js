const { ApolloClient } = require('apollo-client');
const createHttpLink = require('apollo-link-http').createHttpLink;
const crypto = require('crypto');
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

      const { data } = await client.query({
        query: gql`${query}`,
        variables
      });

      if (data) {
        const cache = JSON.stringify(client.extract());
        const md5 = crypto.createHash('md5').update(query + JSON.stringify(variables)).digest('hex');

        /* Get the requests entire (full) route and rootRoute to use as reference for designated cache directory */
        const { origin, referer } = req.headers;
        const fullRoute = referer.substring(origin.length, referer.length);
        const rootRoute = fullRoute.substring(0, fullRoute.substring(1, fullRoute.length).indexOf('/') + 1);
        const targetDir = path.join(context.publicDir, rootRoute);
        const targetFile = path.join(targetDir, `${md5}-cache.json`);

        if (!fs.existsSync(targetFile)) {
          fs.mkdirsSync(targetDir, { recursive: true });
          fs.writeFileSync(path.join(targetFile), cache, 'utf8');
        }
      }
      resolve();
    } catch (err) {
      console.error('create cache error', err);
      reject(err);
    }
  });
}; 