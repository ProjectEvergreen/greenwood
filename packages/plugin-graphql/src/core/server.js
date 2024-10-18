import { ApolloServer } from 'apollo-server';

const graphqlServer = async (compilation) => {
  const { config, graph, context } = compilation;
  const isDev = process.env.__GWD_COMMAND__ === 'develop'; // eslint-disable-line no-underscore-dangle
  const { createSchema } = await import('../schema/schema.js');
  const { createCache } = await import('./cache.js');
  // disable playground for production builds
  const playground = isDev ?
    {
      endpoint: '/graphql',
      settings: {
        'editor.theme': 'light'
      }
    }
    : {};

  const server = new ApolloServer({
    schema: await createSchema(compilation),
    playground,
    introspection: isDev,
    context: async (integrationContext) => {
      const { req } = integrationContext;

      // make sure to ignore introspection requests from being generated as an output cache file
      // https://stackoverflow.com/a/58040379/417806
      if (req.query.q !== 'internal' && req.body.operationName !== 'IntrospectionQuery') {
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