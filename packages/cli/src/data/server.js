const { ApolloServer } = require('apollo-server');
const schema = require('./schema/schema');
const createCache = require('./cache');

module.exports = (compilation) => {
  const { config, graph, context } = compilation;

  // Create schema
  const server = new ApolloServer({
    schema,
    playground: {
      endpoint: '/graphql',
      settings: {
        'editor.theme': 'light'
      }
    },
    context: async (integrationContext) => {
      const { req } = integrationContext;

      if (req.query.q !== 'internal') {
        await createCache(req, context);
      }

      return {
        config,
        graph
      };
    }
  });

  return server;
};