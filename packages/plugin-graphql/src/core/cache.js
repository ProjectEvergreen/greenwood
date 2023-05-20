// we "deep" link into the Apollo package to avoid pulling in React
// https://www.apollographql.com/docs/react/migrating/apollo-client-3-migration/#using-apollo-client-without-react
import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client/core/index.js';
import { checkResourceExists } from '@greenwood/cli/src/lib/resource-utils.js';
import fs from 'fs/promises';
import { gql } from 'apollo-server';
import { getQueryHash } from './common.js';

/* Extract cache server-side */
const createCache = async (req, context) => {

  return new Promise(async(resolve, reject) => {
    try {
      const client = await new ApolloClient({
        link: new HttpLink({
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
        const { outputDir } = context;
        const cache = JSON.stringify(data);
        const queryHash = getQueryHash(query, variables);
        const hashFilename = `${queryHash}-cache.json`;
        const cachePath = new URL(`./${hashFilename}`, outputDir);

        if (!await checkResourceExists(outputDir)) {
          await fs.mkdir(outputDir);
        }

        if (!await checkResourceExists(cachePath)) {
          await fs.writeFile(cachePath, cache, 'utf-8');
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