// GraphQL-Express middleware
const { ApolloServer } = require('apollo-server');
const { typeDefs, resolvers } = require('./schema');

module.exports = (graph) => {

  // Create schema
  // disable playground in prod
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    playground: {
      endpoint: '/graphql',
      settings: {
        'request.credentials': 'include',
        'editor.theme': 'light'
      }
    },
    context: () => ({
      graph
    })
  });

  // The `listen` method launches a web server.
  server.listen().then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
  });

};