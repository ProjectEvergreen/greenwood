/*
 * 
 * Manages web standard resource related operations for JavaScript.
 * This is a Greenwood default plugin.
 *
 */
const fs = require('fs');
const path = require('path');
const { ResourceInterface } = require('../../lib/resource-interface');

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
        const routerUrl = path.join(__dirname, '../../', 'lib/router.js');

        resolve(routerUrl);
      } catch (e) {
        reject(e);
      }
    });
  }

  async shouldOptimize(url) {
    return Promise.resolve(path.extname(url) === '.html' && this.compilation.config.mode === 'mpa');
  }

  async optimize(url, body) {
    return new Promise(async (resolve, reject) => {
      try {
        let currentTemplate;
        const { projectDirectory, scratchDir, outputDir } = this.compilation.context;
        const bodyContents = body.match(/<body>(.*)<\/body>/s)[0].replace('<body>', '').replace('</body>', '');
        const outputBundlePath = path.normalize(`${outputDir}/_routes${url.replace(projectDirectory, '')}`)
          .replace(`.greenwood${path.sep}`, '');

        const routeTags = this.compilation.graph.map((page) => {
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
              ${bodyContents}\n
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

module.exports = (options = {}) => {
  return {
    type: 'resource',
    name: 'plugin-optimization-mpa',
    provider: (compilation) => new OptimizationMPAResource(compilation, options)
  };
}; 