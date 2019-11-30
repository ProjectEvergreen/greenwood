const { ApolloServer } = require('apollo-server');
const { typeDefs, resolvers } = require('./schemas/schemas');
// const createCache = require('./cache');

module.exports = ({ graph }) => {

  // Create schema
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    playground: {
      endpoint: '/graphql',
      settings: {
        'editor.theme': 'light'
      }
    },
    context: async({ req }) => {
      if (req.query.q !== 'internal') {
        // await createCache(req, context);
      }
      return { graph };
    }
  });

  // The `listen` method launches a web server.
  server.listen().then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
  });

};