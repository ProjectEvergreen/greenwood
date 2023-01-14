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
    this.extensions = ['json'];
    this.contentType = 'text/javascript';
  }

  // TODO handle it from node_modules too, when without `?type=json`
  async shouldIntercept(url) {
    return url.searchParams.has('type') && url.searchParams.get('type') === this.extensions[0];
  }

  async intercept(url, request, response) {
    // TODO better way to handle this?
    // https://github.com/ProjectEvergreen/greenwood/issues/948
    const body = await response.text() === ''
      ? await fs.promises.readFile(url, 'utf-8')
      : await response.text();

    return new Response(`export default ${JSON.stringify(body)}`, {
      headers: new Headers({
        'Content-Type': this.contentType
      })
    });
  }
}

const greenwoodPluginImportJson = (options = {}) => [{
  type: 'resource',
  name: 'plugin-import-json:resource',
  provider: (compilation) => new ImportJsonResource(compilation, options)
}];

export { greenwoodPluginImportJson };