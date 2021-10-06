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
    const litNodeModulesLocation = getNodeModulesLocationForPackage('lit');

    return new Promise(async (resolve, reject) => {
      try {
        const { outputDir, projectDirectory, userWorkspace } = this.compilation.context;
        const dependencies = fs.existsSync(path.join(userWorkspace, 'package.json')) // handle monorepos first
          ? JSON.parse(fs.readFileSync(path.join(userWorkspace, 'package.json'), 'utf-8')).dependencies
          : fs.existsSync(path.join(projectDirectory, 'package.json'))
            ? JSON.parse(fs.readFileSync(path.join(projectDirectory, 'package.json'), 'utf-8')).dependencies
            : {};
        const litPolyfill = dependencies && dependencies.lit
          ? '<script src="/node_modules/lit/polyfill-support.js"></script>\n'
          : '';
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

        if (litPolyfill !== '' && !fs.existsSync(path.join(outputDir, 'polyfill-support.js'))) {
          await fs.promises.copyFile(
            path.join(litNodeModulesLocation, 'polyfill-support.js'),
            path.join(outputDir, 'polyfill-support.js')
          );
        }

        const newHtml = body.replace('<head>', `
          <head>
            ${litPolyfill}
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