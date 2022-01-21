import fs from 'fs';
import { getNodeModulesLocationForPackage } from '@greenwood/cli/src/lib/node-modules-utils.js';
import path from 'path';
import { ResourceInterface } from '@greenwood/cli/src/lib/resource-interface.js';

class PolyfillsResource extends ResourceInterface {
  constructor(compilation, options = {}) {
    super(compilation, options);
  }

  async shouldOptimize(url = '', body, headers = {}) {
    return Promise.resolve(path.extname(url) === '.html' || (headers.request && headers.request['content-type'].indexOf('text/html') >= 0));
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

const greenwoodPluginPolyfills = (options = {}) => {
  return [{
    type: 'resource',
    name: 'plugin-polyfills',
    provider: (compilation) => new PolyfillsResource(compilation, options)
  }, {
    type: 'copy',
    name: 'plugin-copy-polyfills',
    provider: async (compilation) => {
      const { outputDir } = compilation.context;
      const polyfillPackageName = '@webcomponents/webcomponentsjs';
      const polyfillNodeModulesLocation = await getNodeModulesLocationForPackage(polyfillPackageName);
      const litNodeModulesLocation = await getNodeModulesLocationForPackage('lit');
      const litPolyfills = litNodeModulesLocation
        ? [{
          from: path.join(litNodeModulesLocation, 'polyfill-support.js'),
          to: path.join(outputDir, 'polyfill-support.js')
        }]
        : [];

      return [{
        from: path.join(polyfillNodeModulesLocation, 'webcomponents-loader.js'),
        to: path.join(outputDir, 'webcomponents-loader.js')
      }, {
        from: path.join(polyfillNodeModulesLocation, 'bundles'),
        to: path.join(outputDir, 'bundles')
      }, 
      ...litPolyfills
      ];
    }
  }];
};

export {
  greenwoodPluginPolyfills
};