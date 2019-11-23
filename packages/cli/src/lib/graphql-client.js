import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { HttpLink } from 'apollo-link-http';
import gql from 'graphql-tag';

const cache = new InMemoryCache();
const link = new HttpLink({
  uri: 'http://localhost:4000?q=internal' /* specific internal flag to prevent looping cache on request */
});

const client = new ApolloClient({
  cache,
  link
});

// ... above is the instantiation of the client object.
client
  .query({
    query: gql`
      query Query {
        hello
      }
    `
  })
  .then(result => console.log(result));