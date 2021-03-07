const { ApolloClient } = require('apollo-client');
const createHttpLink = require('apollo-link-http').createHttpLink;
const fetch = require('node-fetch');
const fs = require('fs');
const { gql } = require('apollo-server');
const InMemoryCache = require('apollo-cache-inmemory').InMemoryCache;
// const path = require('path');
const { getQueryHash } = require('./common.server');

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
      // const queryObj = gql`${query}`;

      const { data } = await client.query({
        query: gql`${query}`,
        variables
      });

      if (data) {
        const { outputDir } = context;

        // const cache = JSON.stringify(client.extract());
        const cache = JSON.stringify(data);
        const queryHash = getQueryHash(query, variables);
        const hashFilename = `${queryHash}-cache.json`;
        const cachePath = `${outputDir}/${hashFilename}`;

        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir);
        }

        if (!fs.existsSync(cachePath)) {
          fs.writeFileSync(cachePath, cache, 'utf8');
        }
      }
      
      resolve();
    } catch (err) {
      console.error('create cache error', err);
      reject(err);
    }
  });
}; 