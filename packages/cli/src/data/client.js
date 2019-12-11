import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { HttpLink } from 'apollo-link-http';

const cache = new InMemoryCache();
const link = new HttpLink({
  uri: 'http://localhost:4000',
  cache: new InMemoryCache().restore(window.__APOLLO_STATE__) // eslint-disable-line no-underscore-dangle
});

const client = new ApolloClient({
  cache,
  link
});

const backupClientQuery = client.query;

client.query = (args) => {
  // console.log('intercepted client query call', args);
  return backupClientQuery(args);
};

export default client;