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

class StaticRouterResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['.html'];
    this.contentType = 'text/html';
    this.libPath = '@greenwood/router/router.js';
  }

  async shouldResolve(request) {
    const url = new URL(request.url);

    return url.pathname.indexOf(this.libPath) >= 0;
  }

  async resolve() {
    const routerUrl = new URL('../../lib/router.js', import.meta.url);
    
    return new Request(`file://${routerUrl.pathname}`);
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
        body = body.replace('</head>', `
          <script type="module" src="/node_modules/@greenwood/cli/src/lib/router.js"></script>\n
          </head>
        `);

        resolve({ body });
      } catch (e) {
        reject(e);
      }
    });
  }

  async shouldOptimize(url, body, headers = { request: {} }) {
    const contentType = headers.request['content-type'];

    return Promise.resolve(this.compilation.config.staticRouter
      && url !== '404.html'
      && (path.extname(url) === '.html' || (contentType && contentType.indexOf('text/html') >= 0)));
  }

  async optimize(url, body) {
    return new Promise(async (resolve, reject) => {
      try {
        let currentTemplate;
        const isStaticRoute = this.compilation.graph.filter(page => page.outputPath === url && url !== '/404/' && !page.isSSR).length === 1;
        const { outputDir } = this.compilation.context;
        const bodyContents = body.match(/<body>(.*)<\/body>/s)[0].replace('<body>', '').replace('</body>', '');
        const outputBundlePath = path.join(`${outputDir}/_routes${url}`);

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

            if (url === page.outputPath) {
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
          <script>
            window.__greenwood = window.__greenwood || {};
            window.__greenwood.currentTemplate = "${currentTemplate}";
          </script>
          </head>
        `.replace(/\n/g, '').replace(/ /g, ''))
          .replace(/<body>(.*)<\/body>/s, `
            <body>\n

              <router-outlet>
                ${bodyContents.replace(/\$/g, '$$$')}\n
              </router-outlet>

              ${routeTags.join('\n')}
            </body>
          `);

        resolve(body);
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