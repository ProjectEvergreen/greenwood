/*
 * 
 * Manages web standard resource related operations for JavaScript.
 * This is a Greenwood default plugin.
 *
 */
import fs from 'fs';
import path from 'path';
import { ResourceInterface } from '../../lib/resource-interface.js';

class OptimizationMPAResource extends ResourceInterface {
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
        const routerUrl = new URL('../../lib/router.js', import.meta.url).pathname;

        resolve(routerUrl);
      } catch (e) {
        reject(e);
      }
    });
  }

  async shouldOptimize(url) {
    return Promise.resolve(url !== '404.html' && path.extname(url) === '.html' && this.compilation.config.mode === 'mpa');
  }

  async optimize(url, body) {
    return new Promise(async (resolve, reject) => {
      try {
        let currentTemplate;
        const { projectDirectory, scratchDir, outputDir } = this.compilation.context;
        const bodyContents = body.match(/<body>(.*)<\/body>/s)[0].replace('<body>', '').replace('</body>', '');
        const outputBundlePath = path.normalize(`${outputDir}/_routes${url.replace(projectDirectory, '')}`)
          .replace(`.greenwood${path.sep}`, '');

        const routeTags = this.compilation.graph
          .filter(page => page.route !== '/404/')
          .map((page) => {
            const template = path.extname(page.filename) === '.html'
              ? page.route
              : page.template;
            const key = page.route === '/'
              ? ''
              : page.route.slice(0, page.route.lastIndexOf('/'));

            if (url.replace(scratchDir, '') === `${page.route}index.html`) {
              currentTemplate = template;
            }
            return `
              <greenwood-route data-route="${page.route}" data-template="${template}" data-key="/_routes${key}/index.html"></greenwood-route>
            `;
          });

        if (!fs.existsSync(path.dirname(outputBundlePath))) {
          fs.mkdirSync(path.dirname(outputBundlePath), {
            recursive: true
          });
        }

        await fs.promises.writeFile(outputBundlePath, bodyContents);

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

        resolve(body);
      } catch (e) {
        reject(e);
      }
    });
  }
}

const greenwoodPluginOptimzationMpa = {
  type: 'resource',
  name: 'plugin-optimization-mpa',
  provider: (compilation, options) => new OptimizationMPAResource(compilation, options)
};

export { greenwoodPluginOptimzationMpa };