import { ApolloServer } from 'apollo-server';

const graphqlServer = async (compilation) => {
  const { config, graph, context } = compilation;
  const { createSchema } = await import('../schema/schema.js');
  const { createCache } = await import('./cache.js');

  const server = new ApolloServer({
    schema: await createSchema(compilation),
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

export { graphqlServer };