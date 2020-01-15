import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { HttpLink } from 'apollo-link-http';

const cache = new InMemoryCache().restore(window.__APOLLO_STATE__); // eslint-disable-line no-underscore-dangle
const link = new HttpLink({
  uri: 'http://localhost:4000'
});

const client = new ApolloClient({
  cache,
  link
});
const backupQuery = client.query;

client.query = (params) => {
  const state = window.__APOLLO_STATE__; // eslint-disable-line no-underscore-dangle

  if (state) {
    // __APOLLO_STATE__ defined, in "SSG" mode...

    // TODO do this witHout the failure call
    return backupQuery(params)
      .catch((err) => {
        console.log('efr', err);
        console.log('error handling!  fetch from disk');
        return fetch('./cache.json')
          .then((data) => {
            return new InMemoryCache().restore(data);
          });
      });
  } else {
    // __APOLLO_STATE__ NOT defined, in SPA mode
    return backupQuery(params);
  }
};

export default client;