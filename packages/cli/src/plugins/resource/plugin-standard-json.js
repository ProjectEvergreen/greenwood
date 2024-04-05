/*
 *
 * Manages web standard resource related operations for JSON.
 * This is a Greenwood default plugin.
 *
 */
import { checkResourceExists } from '../../lib/resource-utils.js';
import fs from 'fs/promises';
import { ResourceInterface } from '../../lib/resource-interface.js';

class StandardJsonResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['json'];
    this.contentType = 'application/json';
  }

  async shouldServe(url) {
    const { protocol, pathname } = url;
    const { basePath } = this.compilation.config;
    const isJson = pathname.split('.').pop() === this.extensions[0];
    const isGraphJson = pathname === `${basePath}/graph.json`;
    const isWorkspaceFile = protocol === 'file:' && await checkResourceExists(url);

    return isJson && (isWorkspaceFile || isGraphJson);
  }

  async serve(url) {
    const { pathname } = url;
    const { scratchDir } = this.compilation.context;
    const { basePath } = this.compilation.config;
    const finalUrl = pathname === `${basePath}/graph.json`
      ? new URL('./graph.json', scratchDir)
      : url;
    const contents = await fs.readFile(finalUrl, 'utf-8');

    return new Response(contents, {
      headers: new Headers({
        'Content-Type': this.contentType
      })
    });
  }

  // TODO how to best tell this was an import attribute specifically other then searchParams???
  async shouldIntercept(url, request) {
    const { protocol, pathname } = url;
    const type = pathname.split('.').pop();
    const dest = request.headers.get('sec-fetch-dest');

    return protocol === 'file:' && dest === 'empty' && type === this.extensions[0];
  }

  async intercept(url, request, response) {
    const json = await response.json();
    const body = `export default ${JSON.stringify(json)}`;

    return new Response(body, {
      headers: {
        'Content-Type': this.contentType
      }
    });
  }
}

const pluginGreenwoodStandardJson = [{
  type: 'resource',
  name: 'plugin-standard-json:resource',
  provider: (compilation, options) => new StandardJsonResource(compilation, options)
}];

export { pluginGreenwoodStandardJson };