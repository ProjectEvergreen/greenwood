/*
 * 
 * Manages routing to API routes.
 *
 */
import path from 'path';
import { pathToFileURL } from 'url';
import { ResourceInterface } from '../../lib/resource-interface.js';

class DevProxyResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
  }

  async shouldServe(url) {
    // TODO check it exists first
    return url.startsWith('/api');
  }

  async serve(url) {
    console.debug('SERVING API => ', { url });
    // TODO stop using path!
    const { handler } = await import(pathToFileURL(`${path.join(this.compilation.context.apisDir, url.replace('/api', ''))}.js`));

    return {
      body: await handler()
    };
  }
}

const greenwoodApiRoutesPlugin = {
  type: 'resource',
  name: 'plugin-api-routes',
  provider: (compilation, options) => new DevProxyResource(compilation, options)
};

export { greenwoodApiRoutesPlugin };