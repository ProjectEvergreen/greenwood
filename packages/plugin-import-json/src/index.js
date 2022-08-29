/*
 * 
 * Manages web standard resource related operations for JSON.
 * This is a Greenwood default plugin.
 *
 */
import { ResourceInterface } from '@greenwood/cli/src/lib/resource-interface.js';

class ImportJsonResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['.json'];
    this.contentType = 'text/javascript';
  }

  // TODO should we re-think how default ResourceInterface handles things?
  async shouldServe() {
    return false;
  }

  // TODO handle it from node_modules too, when without `?type=json`
  async shouldIntercept(url, body, headers) {
    const { originalUrl } = headers.request;
    const type = this.extensions[0].replace('.', '');

    return Promise.resolve(originalUrl && originalUrl.indexOf(`?type=${type}`) >= 0);
  }

  async intercept(url, body) {
    return new Promise(async (resolve, reject) => {
      try {

        resolve({
          body: `export default ${JSON.stringify(body)}`,
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