/*
 * 
 * Manages web standard resource related operations for JSON.
 * This is a Greenwood default plugin.
 *
 */
import fs from 'fs';
import { ResourceInterface } from '@greenwood/cli/src/lib/resource-interface.js';

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

const greenwoodPluginImportJson = (options = {}) => [{
  type: 'resource',
  name: 'plugin-import-json:resource',
  provider: (compilation) => new ImportJsonResource(compilation, options)
}];

export { greenwoodPluginImportJson };