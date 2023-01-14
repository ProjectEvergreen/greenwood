/*
 *
 * 
 * Manages SPA like client side routing for static pages.
 * This is a Greenwood default plugin.
 *
 */
import fs from 'fs';
import { ResourceInterface } from '../../lib/resource-interface.js';

class StaticRouterResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['html'];
    this.contentType = 'text/html';
    this.libPath = '@greenwood/router/router.js';
  }

  async shouldResolve(url) {
    return url.pathname.indexOf(this.libPath) >= 0;
  }

  async resolve() {
    const routerUrl = new URL('../../lib/router.js', import.meta.url);
    
    return new Request(`file://${routerUrl.pathname}`);
  }

  async shouldIntercept(url, request, response) {
    const { pathname, protocol } = url;
    const contentType = response.headers.get['Content-Type'] || '';

    // TODO should this also happen during development too?
    return process.env.__GWD_COMMAND__ === 'build' // eslint-disable-line no-underscore-dangle
      && this.compilation.config.staticRouter
      && !pathname.startsWith('/404')
      && protocol === 'http:' || contentType.indexOf(this.contentType) >= 0;
  }

  async intercept(url, request, response) {
    let body = await response.text();

    body = body.replace('</head>', `
      <script type="module" src="/node_modules/@greenwood/cli/src/lib/router.js"></script>\n
      </head>
    `);

    // TODO avoid having to rebuild response each time?
    return new Response(body, {
      headers: response.headers
    });
  }

  async shouldOptimize(url, response) {
    return this.compilation.config.staticRouter
      && !url.pathname.startsWith('/404')
      && response.headers.get('Content-Type').indexOf(this.contentType) >= 0;
  }

  async optimize(url, response) {
    let body = await response.text();
    const { pathname } = url;
    const isStaticRoute = this.compilation.graph.find(page => page.route === pathname && !page.isSSR);
    const { outputDir } = this.compilation.context;
    const partial = body.match(/<body>(.*)<\/body>/s)[0].replace('<body>', '').replace('</body>', '');
    const outputPartialDirUrl = new URL(`./_routes${url.pathname}`, outputDir);
    const outputPartialDirPath = outputPartialDirUrl.pathname.split('/').slice(0, -1).join('/');
    let currentTemplate;

    const routeTags = this.compilation.graph
      .filter(page => !page.isSSR)
      .filter(page => page.route !== '/404/')
      .map((page) => {
        const template = page.filename && page.filename.split('.').pop() === this.extensions[0]
          ? page.route
          : page.template;
        const key = page.route === '/'
          ? ''
          : page.route.slice(0, page.route.lastIndexOf('/'));

        if (pathname === page.route) {
          currentTemplate = template;
        }
        return `
          <greenwood-route data-route="${page.route}" data-template="${template}" data-key="/_routes${key}/index.html"></greenwood-route>
        `;
      });

    if (isStaticRoute) {
      if (!fs.existsSync(outputPartialDirPath)) {
        fs.mkdirSync(outputPartialDirPath, {
          recursive: true
        });
      }

      await fs.promises.writeFile(new URL('./index.html', outputPartialDirUrl), partial);
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
            ${partial.replace(/\$/g, '$$$')}\n
          </router-outlet>

          ${routeTags.join('\n')}
        </body>
      `);

    // TODO avoid having to rebuild response each time?
    return new Response(body, {
      headers: response.headers
    });
  }
}

const greenwoodPluginStaticRouter = {
  type: 'resource',
  name: 'plugin-static-router',
  provider: (compilation, options) => new StaticRouterResource(compilation, options)
};

export { greenwoodPluginStaticRouter };