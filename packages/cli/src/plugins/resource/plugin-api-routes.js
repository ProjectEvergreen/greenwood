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

  async shouldServe(url) {
    // TODO check it exists first
    return url.startsWith('/api');
  }

  async serve(url) {
    let href = new URL(`${this.getBareUrlPath(url).replace('/api/', '')}.js`, `file://${this.compilation.context.apisDir}`).href;

    // https://github.com/nodejs/modules/issues/307#issuecomment-1165387383
    if (process.env.__GWD_COMMAND__) { // eslint-disable-line no-underscore-dangle
      href = `${resolvedUrl}?t=${Date.now()}`;
    }

    const { handler } = await import(href);
    // TODO can we assume localhost?
    // TODO get port
    const req = new Request(new URL(`https://localhost:1984${url}`));
    const resp = await handler(req);
    const body = await resp.json(); // TODO assumes JSON, pass Response all the way up?

    return {
      body
    };
  }
}

const greenwoodApiRoutesPlugin = {
  type: 'resource',
  name: 'plugin-api-routes',
  provider: (compilation, options) => new ApiRoutesResource(compilation, options)
};

export { greenwoodApiRoutesPlugin };