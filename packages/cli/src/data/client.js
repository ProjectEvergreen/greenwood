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

export default client;