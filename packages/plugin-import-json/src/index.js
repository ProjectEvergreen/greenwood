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
    this.extensions = ['json'];
    this.contentType = 'text/javascript';
  }

  async shouldIntercept(url) {
    const { pathname } = url;

    return pathname.split('.').pop() === this.extensions[0] || (url.searchParams.has('type') && url.searchParams.get('type') === this.extensions[0]);
  }

  async intercept(url, request, response) {
    const json = await response.json();
    const body = `export default ${JSON.stringify(json)}`;

    return new Response(body, {
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