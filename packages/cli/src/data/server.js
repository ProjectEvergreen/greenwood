const { ApolloServer } = require('apollo-server');
const schema = require('./schema/schema');
// const createCache = require('./cache');

module.exports = (compilation) => {
  const { config, graph } = compilation;

  // Create schema
  const server = new ApolloServer({
    schema,
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

      return { 
        config,
        graph 
      };
    }
  });

  // The `listen` method launches a web server.
  server.listen().then(({ url }) => {
    console.log(`🚀 Data Server ready at ${url}`);
  });

};