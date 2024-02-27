import { ResourceInterface } from '@greenwood/cli/src/lib/resource-interface.js';

class LitHydrationResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
  }

  async shouldIntercept(url) {
    const { pathname } = url;
    const matchingRoute = this.compilation.graph.find((node) => node.route === pathname) || {};

    return matchingRoute.isSSR && matchingRoute.hydration;
  }

  async intercept(url, request, response) {
    let body = await response.text();
    const { pathname } = url;
    const matchingRoute = this.compilation.graph.find((node) => node.route === pathname) || {};
    console.log('LIT intercept =>', { url, matchingRoute });

    // TODO would be nice not have to manually set module-shim
    // when we drop support for import-map shim - https://github.com/ProjectEvergreen/greenwood/pull/1115
    const type = process.env.__GWD_COMMAND__ === 'develop' // eslint-disable-line  no-underscore-dangle
      ? 'module-shim'
      : 'module';

    body = body.replace('<head>', `
      <head>
        <!-- this needs to come first before any userland code -->
        <script type="${type}" src="/node_modules/@lit-labs/ssr-client/lit-element-hydrate-support.js"></script>
    `);

    return new Response(body);
  }
}

const greenwoodPluginRendererLit = (options = {}) => {
  return [{
    type: 'renderer',
    name: 'plugin-renderer-lit:renderer',
    provider: () => {
      return {
        executeModuleUrl: new URL('./execute-route-module.js', import.meta.url),
        prerender: options.prerender
      };
    }
  }, {
    type: 'resource',
    name: 'plugin-renderer-lit:resource',
    provider: (compilation, options) => new LitHydrationResource(compilation, options)
  }];
};

export {
  greenwoodPluginRendererLit
};