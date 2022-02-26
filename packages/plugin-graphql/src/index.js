import fs from 'fs';
import { graphqlServer } from './core/server.js';
import { mergeImportMap } from '@greenwood/cli/src/lib/walker-package-ranger.js';
import path from 'path';
import { ResourceInterface } from '@greenwood/cli/src/lib/resource-interface.js';
import { ServerInterface } from '@greenwood/cli/src/lib/server-interface.js';
import rollupPluginAlias from '@rollup/plugin-alias';

class GraphQLResource extends ResourceInterface {
  constructor(compilation, options = {}) {
    super(compilation, options);
    this.extensions = ['.gql'];
    this.contentType = ['text/javascript'];
  }

  async serve(url) {
    return new Promise(async (resolve, reject) => {
      try {
        const js = await fs.promises.readFile(url, 'utf-8');
        const body = `
          export default \`${js}\`;
        `;

        resolve({
          body,
          contentType: this.contentType
        });
      } catch (e) {
        reject(e);
      }
    });
  }
  
  async shouldIntercept(url, body, headers) {
    return Promise.resolve(headers.request.accept && headers.request.accept.indexOf('text/html') >= 0);
  }

  async intercept(url, body) {
    return new Promise(async (resolve, reject) => {
      try {
        const map = {
          '@greenwood/cli/src/lib/hashing-utils.js': '/node_modules/@greenwood/cli/src/lib/hashing-utils.js',
          '@greenwood/plugin-graphql/core/client': '/node_modules/@greenwood/plugin-graphql/src/core/client.js',
          '@greenwood/plugin-graphql/core/common': '/node_modules/@greenwood/plugin-graphql/src/core/common.js',
          '@greenwood/plugin-graphql/queries/children': '/node_modules/@greenwood/plugin-graphql/src/queries/children.gql',
          '@greenwood/plugin-graphql/queries/config': '/node_modules/@greenwood/plugin-graphql/src/queries/config.gql',
          '@greenwood/plugin-graphql/queries/graph': '/node_modules/@greenwood/plugin-graphql/src/queries/graph.gql',
          '@greenwood/plugin-graphql/queries/menu': '/node_modules/@greenwood/plugin-graphql/src/queries/menu.gql'
        };
        const newBody = mergeImportMap(body, map);

        resolve({ body: newBody });
      } catch (e) {
        reject(e);
      }
    });
  }

  async shouldOptimize(url = '', body, headers = {}) {
    return Promise.resolve((url && path.extname(url) === '.html') || (headers.request && headers.request['content-type'].indexOf('text/html') >= 0));
  }

  async optimize(url, body) {
    return new Promise((resolve, reject) => {
      try {
        body = body.replace('<head>', `
          <script data-state="apollo">
            window.__APOLLO_STATE__ = true;
          </script>
          <head>
        `);
    
        resolve(body);
      } catch (e) {
        reject(e);
      }
    });
  }
}

class GraphQLServer extends ServerInterface {
  constructor(compilation, options = {}) {
    super(compilation, options);
  }

  async start() {
    return (await graphqlServer(this.compilation)).listen().then((server) => {
      console.log(`GraphQLServer started at ${server.url}`);
    });
  }
}

const greenwoodPluginGraphQL = (options = {}) => {
  return [{
    type: 'server',
    name: 'plugin-graphql:server',
    provider: (compilation) => new GraphQLServer(compilation, options)
  }, {
    type: 'resource',
    name: 'plugin-graphql:resource',
    provider: (compilation) => new GraphQLResource(compilation, options)
  }, {
    type: 'rollup',
    name: 'plugin-graphql:rollup',
    provider: () => [
      rollupPluginAlias({
        entries: [
          { find: '@greenwood/plugin-graphql/core/client', replacement: '@greenwood/plugin-graphql/src/core/client.js' },
          { find: '@greenwood/plugin-graphql/core/common', replacement: '@greenwood/plugin-graphql/src/core/common.js' },
          { find: '@greenwood/plugin-graphql/queries/menu', replacement: '@greenwood/plugin-graphql/src/queries/menu.gql' },
          { find: '@greenwood/plugin-graphql/queries/config', replacement: '@greenwood/plugin-graphql/src/queries/config.gql' },
          { find: '@greenwood/plugin-graphql/queries/children', replacement: '@greenwood/plugin-graphql/src/queries/children.gql' },
          { find: '@greenwood/plugin-graphql/queries/graph', replacement: '@greenwood/plugin-graphql/src/queries/graph.gql' }
        ]
      })
    ]
  }];
};

export { greenwoodPluginGraphQL };