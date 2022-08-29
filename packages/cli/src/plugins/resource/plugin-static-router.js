/*
 *
 * 
 * Manages SPA like client side routing for static pages.
 * This is a Greenwood default plugin.
 *
 */
import fs from 'fs';
import path from 'path';
import { ResourceInterface } from '../../lib/resource-interface.js';
import { fileURLToPath, URL } from 'url';

class StaticRouterResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['.html'];
    this.contentType = 'text/html';
    this.libPath = '@greenwood/router/router.js';
  }

  async shouldResolve(url) {
    return Promise.resolve(url.indexOf(this.libPath) >= 0);
  }

  async resolve() {
    return new Promise(async (resolve, reject) => {
      try {
        const routerUrl = fileURLToPath(new URL('../../lib/router.js', import.meta.url));

        resolve(routerUrl);
      } catch (e) {
        reject(e);
      }
    });
  }

  async shouldIntercept(url, body, headers = { request: {} }) {
    const contentType = headers.request['content-type'];

    return Promise.resolve(process.env.__GWD_COMMAND__ === 'build' // eslint-disable-line no-underscore-dangle
      && this.compilation.config.staticRouter
      && url !== '404.html'
      && (path.extname(url) === '.html' || (contentType && contentType.indexOf('text/html') >= 0)));
  }

  async intercept(url, body) {
    return new Promise(async (resolve, reject) => {
      try {
        let currentTemplate;
        const isStaticRoute = this.compilation.graph.filter(page => page.route === url && url !== '/404/' && !page.isSSR).length === 1;
        const { outputDir } = this.compilation.context;
        const bodyContents = body.match(/<body>(.*)<\/body>/s)[0].replace('<body>', '').replace('</body>', '');
        const outputBundlePath = path.join(`${outputDir}/_routes${url}/index.html`);

        const routeTags = this.compilation.graph
          .filter(page => !page.isSSR)
          .filter(page => page.route !== '/404/')
          .map((page) => {
            const template = page.filename && path.extname(page.filename) === '.html'
              ? page.route
              : page.template;
            const key = page.route === '/'
              ? ''
              : page.route.slice(0, page.route.lastIndexOf('/'));

            if (url === page.route) {
              currentTemplate = template;
            }
            return `
              <greenwood-route data-route="${page.route}" data-template="${template}" data-key="/_routes${key}/index.html"></greenwood-route>
            `;
          });

        if (isStaticRoute) {
          if (!fs.existsSync(path.dirname(outputBundlePath))) {
            fs.mkdirSync(path.dirname(outputBundlePath), {
              recursive: true
            });
          }

          await fs.promises.writeFile(outputBundlePath, bodyContents);
        }

        body = body.replace('</head>', `
          <script type="module" src="/node_modules/@greenwood/cli/src/lib/router.js"></script>\n
          <script>
            window.__greenwood = window.__greenwood || {};
            window.__greenwood.currentTemplate = "${currentTemplate}";
          </script>
          </head>
        `).replace(/<body>(.*)<\/body>/s, `
          <body>\n

            <router-outlet>
              ${bodyContents.replace(/\$/g, '$$$')}\n
            </router-outlet>

            ${routeTags.join('\n')}
          </body>
        `);

        resolve({ body });
      } catch (e) {
        reject(e);
      }
    });
  }
}

const greenwoodPluginStaticRouter = {
  type: 'resource',
  name: 'plugin-static-router',
  provider: (compilation, options) => new StaticRouterResource(compilation, options)
};

export { greenwoodPluginStaticRouter };