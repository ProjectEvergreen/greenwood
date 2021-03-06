const { ServerInterface } = require('@greenwood/cli/src/lib/server-interface');
const graphqlServer = require('./core/server');

class GraphQLServer extends ServerInterface {
  constructor(compilation, options = {}) {
    super(compilation, options);
  }

  async start() {
    return graphqlServer(this.compilation).listen().then((server) => {
      console.log(`GraphQLServer started at ${server.url}`);
    });
  }
}

module.exports = (options = {}) => {
  return [{
    type: 'server',
    name: 'plugin-graphql:server',
    provider: (compilation) => new GraphQLServer(compilation, options)
  // }, {
  //   type: 'resource',
  //   name: 'plugin-live-reload:resource',
  //   provider: (compilation) => new LiveReloadResource(compilation, options)
  }];
};