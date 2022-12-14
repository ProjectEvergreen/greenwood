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
    // TODO check it exists first.  Could this come from the graph?
    return url.startsWith('/api');
  }

  async serve(url) {
    // TODO we assume host here, but eventually we will be getting a Request
    // https://github.com/ProjectEvergreen/greenwood/issues/948
    const host = `https://localhost:${this.compilation.config.port}`;
    let href = new URL(`${this.getBareUrlPath(url).replace('/api/', '')}.js`, `file://${this.compilation.context.apisDir}`).href;

    // https://github.com/nodejs/modules/issues/307#issuecomment-1165387383
    if (process.env.__GWD_COMMAND__ === 'develop') { // eslint-disable-line no-underscore-dangle
      href = `${href}?t=${Date.now()}`;
    }

    const { handler } = await import(href);
    // TODO we need to pass in headers here
    // https://github.com/ProjectEvergreen/greenwood/issues/948
    const req = new Request(new URL(`${host}${url}`));
    const resp = await handler(req);
    const contents = resp.headers.get('content-type').indexOf('application/json') >= 0
      ? await resp.json()
      : await resp.text();

    return {
      body: contents,
      resp
    };
  }
}

const greenwoodApiRoutesPlugin = {
  type: 'resource',
  name: 'plugin-api-routes',
  provider: (compilation, options) => new ApiRoutesResource(compilation, options)
};

export { greenwoodApiRoutesPlugin };