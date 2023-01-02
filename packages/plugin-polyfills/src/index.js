import { getNodeModulesLocationForPackage } from '@greenwood/cli/src/lib/node-modules-utils.js';
import path from 'path';
import { ResourceInterface } from '@greenwood/cli/src/lib/resource-interface.js';

class PolyfillsResource extends ResourceInterface {
  constructor(compilation, options = {}) {
    super(compilation, options);

    this.options = {
      wc: true,
      dsd: false,
      lit: false,
      ...options
    };
  }

  async shouldIntercept(url) {
    const { protocol, pathname } = url;
    const { wc, lit, dsd } = this.options;
    const hasMatchingPageRoute = this.compilation.graph.find(node => node.route === pathname);
    const isEnabled = wc || lit || dsd;

    return isEnabled && protocol.startsWith('http') && hasMatchingPageRoute;
  }

  async intercept(url, request, response) {
    const { wc, lit, dsd } = this.options;
    let body = await response.text();

    // standard WC polyfill
    if (wc) {
      body = body.replace('<head>', `
        <head>
          <script src="/node_modules/@webcomponents/webcomponentsjs/webcomponents-loader.js"></script>
      `);
    }

    // append Lit polyfill next to make sure it comes before WC polyfill
    if (lit) {
      body = body.replace('<head>', `
        <head>
          <script src="/node_modules/lit/polyfill-support.js"></script>
      `);
    }

    // lastly, Declarative Shadow DOM polyfill
    if (dsd) {
      body = body.replace('</body>', `
          <script>
            if (!HTMLTemplateElement.prototype.hasOwnProperty('shadowRoot')) {
              (function attachShadowRoots(root) {
                root.querySelectorAll("template[shadowroot]").forEach(template => {
                  const mode = template.getAttribute("shadowroot");
                  const shadowRoot = template.parentNode.attachShadow({ mode });
                  shadowRoot.appendChild(template.content);
                  template.remove();
                  attachShadowRoots(shadowRoot);
                });
              })(document);
            }
          </script>
        </body>
      `);
    }

    return new Response(body, {
      headers: response.headers
    });
  }
}

const greenwoodPluginPolyfills = (options = {}) => {
  return [{
    type: 'resource',
    name: 'plugin-polyfills',
    provider: (compilation) => new PolyfillsResource(compilation, options)
  }, {
    type: 'copy',
    name: 'plugin-copy-polyfills',
    provider: async (compilation) => {
      const { outputDir } = compilation.context;
      const polyfillPackageName = '@webcomponents/webcomponentsjs';
      const polyfillNodeModulesLocation = await getNodeModulesLocationForPackage(polyfillPackageName);
      const litNodeModulesLocation = await getNodeModulesLocationForPackage('lit');
      const standardPolyfills = [{
        from: path.join(polyfillNodeModulesLocation, 'webcomponents-loader.js'),
        to: path.join(outputDir, 'webcomponents-loader.js')
      }, {
        from: path.join(polyfillNodeModulesLocation, 'bundles'),
        to: path.join(outputDir, 'bundles')
      }];
      const litPolyfills = [{
        from: path.join(litNodeModulesLocation, 'polyfill-support.js'),
        to: path.join(outputDir, 'polyfill-support.js')
      }];

      return [
        ...!!options.wc ? [] : standardPolyfills, // eslint-disable-line no-extra-boolean-cast
        ...options.lit ? litPolyfills : []
      ];
    }
  }];
};

export {
  greenwoodPluginPolyfills
};