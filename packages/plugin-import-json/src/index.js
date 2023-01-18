/*
 * 
 * Manages web standard resource related operations for JSON.
 * This is a Greenwood default plugin.
 *
 */
// import fs from 'fs';
import { ResourceInterface } from '@greenwood/cli/src/lib/resource-interface.js';

class ImportJsonResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['json'];
    this.contentType = 'text/javascript';
  }

  // TODO handle it from node_modules too, when without `?type=json`
  async shouldIntercept(url) {
    const { pathname } = url;

    return pathname.split('.').pop() === this.extensions[0] || (url.searchParams.has('type') && url.searchParams.get('type') === this.extensions[0]);
  }

  async intercept(url, request, response) {
    console.log('JSON intercept!?!?!?!', { url });
    // TODO better way to handle this?
    // https://github.com/ProjectEvergreen/greenwood/issues/948
    const json = await response.json();
    const body = `export default ${JSON.stringify(json)}`;
    // TODO need to support an empty body to read from disc?
    // const json = body === ''
    //   ? await fs.promises.readFile(url, 'utf-8')
    //   : body;
    console.log('JSON return', { body });

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