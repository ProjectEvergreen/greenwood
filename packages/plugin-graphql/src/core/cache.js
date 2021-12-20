import ApolloCore from '@apollo/client/core/core.cjs.js';
import fetch from 'node-fetch';
import fs from 'fs';
import { gql } from 'apollo-server';
import { getQueryHash } from './common.js';

/* Extract cache server-side */
const createCache = async (req, context) => {

  return new Promise(async(resolve, reject) => {
    try {
      const client = await new ApolloCore.ApolloClient({
        link: new ApolloCore.HttpLink({
          uri: 'http://localhost:4000?q=internal', /* internal flag to prevent looping cache on request */
          fetch
        }),
        cache: new ApolloCore.InMemoryCache()
      });

      /* Take the same query from request, and repeat the query for our server side cache */
      const { query, variables } = req.body;
      const { data } = await client.query({
        query: gql`${query}`,
        variables
      });

      if (data) {
        const { outputDir } = context;
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

export { createCache };