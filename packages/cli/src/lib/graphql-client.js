import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { HttpLink } from 'apollo-link-http';

const cache = new InMemoryCache();
const link = new HttpLink({
  uri: 'http://localhost:4000', // specific internal flag to prevent looping cache on request
  cache: new InMemoryCache().restore(window.__APOLLO_STATE__) // eslint-disable-line no-underscore-dangle
});

const client = new ApolloClient({
  cache,
  link
});

export default client;