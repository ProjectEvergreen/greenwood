// import { checkResourceExists } from '../../lib/resource-utils.js';
// import fs from 'fs/promises';
import { ResourceInterface } from '@greenwood/cli/src/lib/resource-interface.js';

class LitHydrationResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    // this.extensions = ['html'];
    // this.contentType = 'text/html';
    // this.libPath = '@greenwood/router/router.js';
  }

  // assumes Greenwood's standard-html plugin has tracked this metadata
  // during resource serve lifecycle
  async shouldIntercept(url) {
    const { pathname } = url;
    const matchingRoute = this.compilation.graph.find((node) => node.route === pathname) || {};
    const { hydrate, pageData } = matchingRoute;

    return hydrate && pageData;
  }

  async intercept(url, request, response) {
    console.log('SHOULD intercept', { url });
    let body = await response.text();

    // TODO would be nice not to have to do this, but
    // this hydrate lib is not showing up in greenwood build / serve
    const type = process.env.__GWD_COMMAND__ === 'develop' // eslint-disable-line  no-underscore-dangle
      ? 'module-shim'
      : 'module';

    // TODO have to manually set module-shim?
    body = body.replace('<head>', `
      <head>
        <!-- this needs to come first before any userland code -->
        <script type="${type}" src="/node_modules/@lit-labs/ssr-client/lit-element-hydrate-support.js"></script>
    `);

    // TODO full hydration implementation?
    // <script type="module" defer>
    //   // https://lit.dev/docs/ssr/client-usage/
    //   import { render } from 'lit';
    //   import { hydrate } from '@lit-labs/ssr-client'; // this will need to be in users package.json and / or import map
    //   import { getBody } from '../src/pages/products.js';

    //   globalThis.document.addEventListener('DOMContentLoaded', () => {
    //     const hydrationData = JSON.parse(document.getElementById('__GWD_HYDRATION_DATA__')?.textContent || '{"__noData__": true}')
    //     console.log('lets get hydrated!', { hydrationData });

    //     if(!hydrationData.__noData__) {
    //       hydrate(getBody({}, {}, hydrationData), window.document.body);
    //     }
    //   });
    // </script>

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