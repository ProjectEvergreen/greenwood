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
    const { importMaps } = this.compilation.config.polyfills;
    const importMapType = process.env.__GWD_COMMAND__ === 'develop' && importMaps // eslint-disable-line  no-underscore-dangle
      ? 'module-shim'
      : 'module';
    let body = await response.text();

    // this needs to come first before any userland code
    body = body.replace('<head>', `
      <head>
        <script type="${importMapType}" src="/node_modules/@lit-labs/ssr-client/lit-element-hydrate-support.js"></script>
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