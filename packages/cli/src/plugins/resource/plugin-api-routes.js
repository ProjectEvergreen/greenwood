/*
 * 
 * Manages routing to API routes.
 *
 */
import { ResourceInterface } from '../../lib/resource-interface.js';

class ApiRoutesResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
  }

  // only used for development
  async shouldServe(url) {
    const { protocol, pathname } = url;

    return protocol.startsWith('http') && this.compilation.manifest.apis.has(pathname);
  }

  async serve(url, request) {
    const api = this.compilation.manifest.apis.get(url.pathname);
    const apiUrl = new URL(`.${api.path}`, this.compilation.context.userWorkspace);
    // https://github.com/nodejs/modules/issues/307#issuecomment-1165387383
    const href = process.env.__GWD_COMMAND__ === 'develop' // eslint-disable-line no-underscore-dangle
      ? `${apiUrl.href}?t=${Date.now()}`
      : apiUrl.href;

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