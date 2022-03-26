import path from 'path';
import { ResourceInterface } from '@greenwood/cli/src/lib/resource-interface.js';

class PolyfillsResource extends ResourceInterface {
  constructor(compilation, options = {}) {
    super(compilation, options);
  }

  async shouldOptimize(url = '', body, headers = {}) {
    return Promise.resolve(this.options.polyfill && path.extname(url) === '.html' || (headers.request && headers.request['content-type'].indexOf('text/html') >= 0));
  }

  async optimize(url, body) {
    return new Promise(async (resolve, reject) => {
      try {
        const newHtml = body.replace('</body>', `
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

        resolve(newHtml);
      } catch (e) {
        reject(e);
      }
    });
  }
}

export { PolyfillsResource };