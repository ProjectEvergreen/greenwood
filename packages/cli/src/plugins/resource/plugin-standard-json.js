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
    // eslint-disable-next-line no-underscore-dangle
    const contentType = process.env.__GWD_COMMAND__ === 'serve' && url.searchParams?.get('polyfill') === 'type-json'
      ? 'text/javascript'
      : this.contentType;

    return new Response(contents, {
      headers: new Headers({
        'Content-Type': contentType
      })
    });
  }

  async shouldIntercept(url, request) {
    const { protocol, pathname, searchParams } = url;
    const ext = pathname.split('.').pop();

    return protocol === 'file:'
      && ext === this.extensions[0]
      && !searchParams.has('type')
      && (request.headers.get('Accept')?.indexOf('text/javascript') >= 0 || url.searchParams?.get('polyfill') === 'type-json');
  }

  async intercept(url, request, response) {
    const json = await response.json();
    const body = `export default ${JSON.stringify(json)}`;

    return new Response(body, {
      headers: {
        'Content-Type': 'text/javascript'
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