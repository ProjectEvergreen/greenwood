/*
 * 
 * Manages web standard resource related operations for JavaScript.
 * This is a Greenwood default plugin.
 *
 */
const fs = require('fs');
const pluginRollupJson = require('@rollup/plugin-json');
const { ResourceInterface } = require('@greenwood/cli/src/lib/resource-interface');

class ImportJsonResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['.json'];
    this.contentType = 'text/javascript';
  }

  async shouldIntercept(url, body, headers) {
    const { originalUrl } = headers.request;

    return Promise.resolve(originalUrl && originalUrl.indexOf('?type=json') >= 0);
  }

  async intercept(url) {
    return new Promise(async (resolve, reject) => {
      try {
        const contents = await fs.promises.readFile(url, 'utf-8');
        const body = `export default ${contents}`;

        resolve({
          body,
          contentType: this.contentType
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}

module.exports = (options = {}) => [{
  type: 'resource',
  name: 'plugin-import-json:resource',
  provider: (compilation) => new ImportJsonResource(compilation, options)
}, {
  type: 'rollup',
  name: 'plugin-import-json:rollup',
  provider: () => {
    return [
      pluginRollupJson()
    ];
  }
}];