/*
 * 
 * Manages routing to API routes.
 *
 */
import { checkResourceExists } from '../../lib/resource-utils.js';
import { ResourceInterface } from '../../lib/resource-interface.js';

class ApiRoutesResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
  }

  async shouldServe(url) {
    const { protocol, pathname } = url;
    const apiPathUrl = new URL(`.${pathname.replace('/api', '')}.js`, this.compilation.context.apisDir);

    if (protocol.startsWith('http') && pathname.startsWith('/api') && await checkResourceExists(apiPathUrl)) {
      return true;
    }
  }

  async serve(url, request) {
    let href = new URL(`./${url.pathname.replace('/api/', '')}.js`, `file://${this.compilation.context.apisDir.pathname}`).href;

    // https://github.com/nodejs/modules/issues/307#issuecomment-1165387383
    if (process.env.__GWD_COMMAND__ === 'develop') { // eslint-disable-line no-underscore-dangle
      href = `${href}?t=${Date.now()}`;
    }

    const { handler } = await import(href);
    const req = new Request(new URL(`${request.url.origin}${url}`), {
      ...request
    });

    return await handler(req);
  }
}

const greenwoodApiRoutesPlugin = {
  type: 'resource',
  name: 'plugin-api-routes',
  provider: (compilation, options) => new ApiRoutesResource(compilation, options)
};

export { greenwoodApiRoutesPlugin };