const fs = require('fs');
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
    const filename = 'webcomponents-loader.js';
    const nodeModuleRoot = 'node_modules/@webcomponents/webcomponentsjs';

    return new Promise(async (resolve, reject) => {
      try {
        const cwd = process.cwd();
        const { outputDir } = this.compilation.context;
        const polyfillFiles = [
          'webcomponents-loader.js',
          ...fs.readdirSync(path.join(process.cwd(), nodeModuleRoot, 'bundles')).map(file => {
            return `bundles/${file}`;
          })
        ];

        if (!fs.existsSync(path.join(outputDir, 'bundles'))) {
          fs.mkdirSync(path.join(outputDir, 'bundles'));
        }

        await Promise.all(polyfillFiles.map(async (file) => {
          const from = path.join(cwd, nodeModuleRoot, file);
          const to = path.join(outputDir, file);
          
          return !fs.existsSync(to)
            ? fs.promises.copyFile(from, to)
            : Promise.resolve();
        }));

        const newHtml = body.replace('<head>', `
          <head>
            <script src="/${nodeModuleRoot}/${filename}"></script>
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