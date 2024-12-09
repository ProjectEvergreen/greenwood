import { ResourceInterface } from '@greenwood/cli/src/lib/resource-interface.js';
import { derivePackageRoot, resolveBareSpecifier } from '@greenwood/cli/src/lib/walker-package-ranger.js';

class PolyfillsResource extends ResourceInterface {
  constructor(compilation, options = {}) {
    super(compilation, options);

    this.contentType = 'text/html';
    this.options = {
      wc: true,
      dsd: false,
      lit: false,
      ...options
    };
  }

  async shouldIntercept(url, request, response) {
    const { protocol } = url;
    const { wc, lit, dsd } = this.options;
    const isEnabled = wc || lit || dsd;

    return isEnabled
      && protocol.startsWith('http')
      && response.headers.get('Content-Type')?.indexOf(this.contentType) >= 0;
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

    return new Response(body);
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
      const polyfillSpecifier = '@webcomponents/webcomponentsjs';
      const polyfillsResolved = resolveBareSpecifier(polyfillSpecifier);
      const polyfillsRoot = derivePackageRoot(polyfillsResolved);
      const litSpecifier = 'lit';
      const litResolved = resolveBareSpecifier(litSpecifier);
      const litRoot = derivePackageRoot(litResolved);

      const standardPolyfills = [{
        from: new URL('./webcomponents-loader.js', polyfillsRoot),
        to: new URL('./webcomponents-loader.js', outputDir)
      }, {
        from: new URL('./bundles/', polyfillsRoot),
        to: new URL('./bundles/', outputDir)
      }];
      const litPolyfills = [{
        from: new URL('./polyfill-support.js', litRoot),
        to: new URL('./polyfill-support.js', outputDir)
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