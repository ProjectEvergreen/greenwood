const { getNodeModulesLocationForPackage } = require('@greenwood/cli/src/lib/node-modules-utils');
const path = require('path');
const { ResourceInterface } = require('@greenwood/cli/src/lib/resource-interface');

class PolyfillsResource extends ResourceInterface {
  constructor(compilation, options = {}) {
    super(compilation, options);
  }

  async shouldOptimize(url) {
    return Promise.resolve(path.extname(url) === '.html');
  }

  async optimize(url, body) {
    return new Promise(async (resolve, reject) => {
      try {
        const { projectDirectory, userWorkspace } = this.compilation.context;
        const dependencies = fs.existsSync(path.join(userWorkspace, 'package.json')) // handle monorepos first
          ? JSON.parse(fs.readFileSync(path.join(userWorkspace, 'package.json'), 'utf-8')).dependencies
          : fs.existsSync(path.join(projectDirectory, 'package.json'))
            ? JSON.parse(fs.readFileSync(path.join(projectDirectory, 'package.json'), 'utf-8')).dependencies
            : {};
        const litPolyfill = dependencies && dependencies.lit
          ? '<script src="/node_modules/lit/polyfill-support.js"></script>\n'
          : '';

        const newHtml = body.replace('<head>', `
          <head>
            ${litPolyfill}
            <script src="/node_modules/@webcomponents/webcomponentsjs/webcomponents-loader.js"></script>
        `);

        resolve(newHtml);
      } catch (e) {
        reject(e);
      }
    });
  }
}

module.exports = (options = {}) => {
  return [{
    type: 'resource',
    name: 'plugin-polyfills',
    provider: (compilation) => new PolyfillsResource(compilation, options)
  }, {
    type: 'copy',
    name: 'plugin-copy-polyfills',
    provider: (compilation) => {
      const { context } = compilation;
      const polyfillPackageName = '@webcomponents/webcomponentsjs';
      const polyfillNodeModulesLocation = getNodeModulesLocationForPackage(polyfillPackageName);
      const litNodeModulesLocation = getNodeModulesLocationForPackage('lit');
      const litPolyfills = litNodeModulesLocation
        ? [{
          from: path.join(litNodeModulesLocation, 'polyfill-support.js'),
          to: path.join(context.outputDir, 'polyfill-support.js')
        }]
        : [];

      return [{
        from: path.join(polyfillNodeModulesLocation, 'webcomponents-loader.js'),
        to: path.join(context.outputDir, 'webcomponents-loader.js')
      }, {
        from: path.join(polyfillNodeModulesLocation, 'bundles'),
        to: path.join(context.outputDir, 'bundles')
      }, 
      ...litPolyfills
      ];
    }
  }];
};