const fs = require('fs');
const graphqlServer = require('./core/server');
// const gql = require('graphql-tag');
const path = require('path');
const { ResourceInterface } = require('@greenwood/cli/src/lib/resource-interface');
const { ServerInterface } = require('@greenwood/cli/src/lib/server-interface');
const rollupPluginAlias = require('@rollup/plugin-alias');

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
        // const gqlJs = gql`${js}`;
        // const body = `
        //   export default ${JSON.stringify(gqlJs)};
        // `;
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

  // "apollo-client": "/node_modules/apollo-client/bundle.esm.js",
  // "apollo-cache-inmemory": "/node_modules/apollo-cache-inmemory/lib/bundle.esm.js",
  // "apollo-link-http": "/node_modules/apollo-link-http/lib/bundle.esm.js",
  // "apollo-utilities": "/node_modules/apollo-utilities/lib/bundle.esm.js",
  // "apollo-link": "/node_modules/apollo-link/lib/bundle.esm.js",
  // "apollo-cache": "/node_modules/apollo-cache/lib/bundle.esm.js",
  // "apollo-link-http-common": "/node_modules/apollo-link-http-common/lib/bundle.esm.js",
  // "optimism": "/node_modules/optimism/lib/bundle.esm.js",
  // "tslib": "/node_modules/tslib/tslib.es6.js",
  // "symbol-observable": "/node_modules/symbol-observable/es/index.js",
  // "ts-invariant": "/node_modules/ts-invariant/lib/invariant.esm.js",
  // "@wry/context": "/node_modules/@wry/context/lib/context.esm.js",
  // "@wry/equality": "/node_modules/@wry/equality/lib/equality.esm.js",
  // "graphql/jsutils/inspect": "/node_modules/graphql/jsutils/inspect.mjs",
  // "graphql/language/visitor": "/node_modules/graphql/language/visitor.mjs",
  // "graphql/language/parser": "/node_modules/graphql/language/parser.mjs",
  // "graphql/language/printer": "/node_modules/graphql/language/printer.mjs",
  // "zen-observable": "/node_modules/zen-observable/esm.js",
  // "zen-observable-ts": "/node_modules/zen-observable-ts/lib/bundle.esm.js",
  // "fast-json-stable-stringify": "/node_modules/fast-json-stable-stringify/index.js",
  // "graphql-tag": "/node_modules/graphql-tag/src/index.js",
  async intercept(url, body) {
    return new Promise(async (resolve, reject) => {
      try {
        // es-modules-shims breaks on dangling commas in an importMap :/
        const danglingComma = body.indexOf('"imports": {}') > 0 
          ? ''
          : ',';
        const shimmedBody = body.replace('"imports": {', `
          "imports": {
            "@greenwood/plugin-graphql/core/client": "/node_modules/@greenwood/plugin-graphql/src/core/client.js",
            "@greenwood/plugin-graphql/core/common": "/node_modules/@greenwood/plugin-graphql/src/core/common.client.js",
            "@greenwood/plugin-graphql/queries/children": "/node_modules/@greenwood/plugin-graphql/src/queries/children.gql",
            "@greenwood/plugin-graphql/queries/config": "/node_modules/@greenwood/plugin-graphql/src/queries/config.gql",
            "@greenwood/plugin-graphql/queries/graph": "/node_modules/@greenwood/plugin-graphql/src/queries/graph.gql",
            "@greenwood/plugin-graphql/queries/menu": "/node_modules/@greenwood/plugin-graphql/src/queries/menu.gql"${danglingComma}
        `);

        resolve({ body: shimmedBody });
      } catch (e) {
        reject(e);
      }
    });
  }

  async shouldOptimize(url) {
    return Promise.resolve(path.extname(url) === '.html');
  }

  async optimize(url, body) {
    return new Promise((resolve, reject) => {
      try {
        // TODO const apolloScript = isStrictOptimization (no apollo-state)
        body = body.replace('<head>', `
          <script data-state="apollo">
            window.__APOLLO_STATE__ = true;
          </script>
          </head>
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
          { find: '@greenwood/plugin-graphql/core/common', replacement: '@greenwood/plugin-graphql/src/core/common.client.js' },
          { find: '@greenwood/plugin-graphql/queries/menu', replacement: '@greenwood/plugin-graphql/src/queries/menu.gql' },
          { find: '@greenwood/plugin-graphql/queries/config', replacement: '@greenwood/plugin-graphql/src/queries/config.gql' },
          { find: '@greenwood/plugin-graphql/queries/children', replacement: '@greenwood/plugin-graphql/src/queries/children.gql' },
          { find: '@greenwood/plugin-graphql/queries/graph', replacement: '@greenwood/plugin-graphql/src/queries/graph.gql' }
        ]
      })
    ]
  }];
};