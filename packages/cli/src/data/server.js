const { ApolloServer } = require('apollo-server');

module.exports = (compilation) => {
  const { config, graph, context } = compilation;
  const schema = require('./schema/schema')(graph);
  const createCache = require('./cache');

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