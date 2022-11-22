/*
 * 
 * Manages routing to API routes.
 *
 */
import path from 'path';
import { pathToFileURL } from 'url';
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
    console.debug('SERVING API => ', { url });
    // TODO stop using path / url helpers!
    const { handler } = await import(pathToFileURL(`${path.join(this.compilation.context.apisDir, this.getBareUrlPath(url).replace('/api', ''))}.js`));
    const req = new Request(new URL(`https://localhost:1984${url}`)); // TODO can we assume localhost?
    const resp = await handler(req);
    const body = await resp.json(); // TODO assumes JSON

    console.debug({ body });

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