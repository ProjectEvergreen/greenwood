/*
 * 
 * Manages routing to API routes.
 *
 */
import fs from 'fs';
import { ResourceInterface } from '../../lib/resource-interface.js';

class ApiRoutesResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
  }

  async shouldServe(url) {
    // TODO Could this existence check be derived from the graph instead, like pages are?
    // https://github.com/ProjectEvergreen/greenwood/issues/946
    return url.protocol.indexOf('http') === 0
      && url.pathname.startsWith('/api')
      && fs.existsSync(this.compilation.context.apisDir, url.pathname.replace('/api/', ''));
  }

  async serve(url, request) {
    let href = new URL(`./${url.pathname.replace('/api/', '')}.js`, `file://${this.compilation.context.apisDir}`).href;

    // https://github.com/nodejs/modules/issues/307#issuecomment-1165387383
    if (process.env.__GWD_COMMAND__ === 'develop') { // eslint-disable-line no-underscore-dangle
      href = `${href}?t=${Date.now()}`;
    }

    const { handler } = await import(href);
    const req = new Request(new URL(`${request.url.origin}${url}`), {
      ...request
    });
    const resp = await handler(req);

    return resp;
  }
}

const greenwoodApiRoutesPlugin = {
  type: 'resource',
  name: 'plugin-api-routes',
  provider: (compilation, options) => new ApiRoutesResource(compilation, options)
};

export { greenwoodApiRoutesPlugin };