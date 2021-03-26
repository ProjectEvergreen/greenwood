/*
 * 
 * Manages web standard resource related operations for JavaScript.
 * This is a Greenwood default plugin.
 *
 */
const fs = require('fs');
const path = require('path');
const { ResourceInterface } = require('../../lib/resource-interface');
// const rollupPluginAlias = require('@rollup/plugin-alias');

class OptimizationMPAResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['.html'];
    this.contentType = 'text/html';
    this.libPath = '@greenwood/router/router.js';
  }

  // TODO make this work using this.libPath
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

  // TODO add support for running in development?
  // async shouldIntercept(url, body, headers) {
  //   return Promise.resolve(this.compilation.config.optimization === 'mpa' && headers.request.accept.indexOf('text/html') >= 0);
  // }

  // async intercept(url, body) {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       // es-modules-shims breaks on dangling commas in an importMap :/
  //       const danglingComma = body.indexOf('"imports": {}') > 0 
  //         ? ''
  //         : ',';
  //       const shimmedBody = body.replace('"imports": {', `
  //         "imports": {
  //           "@greenwood/cli/lib/router": "/node_modules/@greenwood/cli/lib/router.js"${danglingComma}
  //       `);

  //       resolve({ body: shimmedBody });
  //     } catch (e) {
  //       reject(e);
  //     }
  //   });
  // }

  async shouldOptimize(url) {
    return Promise.resolve(path.extname(url) === '.html' && this.compilation.config.mode === 'mpa');
  }

  async optimize(url, body) {
    return new Promise(async (resolve, reject) => {
      try {
        let currentTemplate;
        const { projectDirectory, scratchDir, outputDir } = this.compilation.context;
        const bodyContents = body.match(/<body>(.*)<\/body>/s)[0].replace('<body>', '').replace('</body>', '');
        const outputBundlePath = `${outputDir}/_routes${url.replace(projectDirectory, '')}`
          .replace('.greenwood/', '')
          .replace('//', '/');

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

        // TODO this gets swalloed by Rollup?
        // <script type="module" src="/node_modules/@greenw">
        //   import "@greenwood/cli/lib/router";
        // </script>\n
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
  return [{
    type: 'resource',
    name: 'plugin-optimization-mpa',
    provider: (compilation) => new OptimizationMPAResource(compilation, options)
  // }, {
  //   type: 'rollup',
  //   name: 'plugin-optimization-mpa:rollup',
  //   provider: () => [
  //     rollupPluginAlias({
  //       entries: [
  //         { find: '@greenwood/cli/lib/router', replacement: '/node_modules/@greenwood/cli/lib/router.js' }
  //       ]
  //     })
  //   ]
  }];
}; 