const fs = require('fs');
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
    const polyfillPackageName = '@webcomponents/webcomponentsjs';
    const filename = 'webcomponents-loader.js';
    const polyfillNodeModulesLocation = getNodeModulesLocationForPackage(polyfillPackageName);

    return new Promise(async (resolve, reject) => {
      try {
        const { outputDir } = this.compilation.context;
        const polyfillFiles = [
          'webcomponents-loader.js',
          ...fs.readdirSync(path.join(polyfillNodeModulesLocation, 'bundles')).map(file => {
            return `bundles/${file}`;
          })
        ];

        if (!fs.existsSync(path.join(outputDir, 'bundles'))) {
          fs.mkdirSync(path.join(outputDir, 'bundles'));
        }

        await Promise.all(polyfillFiles.map(async (file) => {
          const from = path.join(polyfillNodeModulesLocation, file);
          const to = path.join(outputDir, file);
          
          return !fs.existsSync(to)
            ? fs.promises.copyFile(from, to)
            : Promise.resolve();
        }));

        const newHtml = body.replace('<head>', `
          <head>
            <script src="/node_modules/${polyfillPackageName}/${filename}"></script>
        `);

        resolve(newHtml);
      } catch (e) {
        reject(e);
      }
    });
  }
}

module.exports = (options = {}) => {
  return {
    type: 'resource',
    name: 'plugin-polyfills',
    provider: (compilation) => new PolyfillsResource(compilation, options)
  };
};