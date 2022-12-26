/*
 * 
 * Manages routing devServer.proxy entries to their destination.
 *
 */
import { ResourceInterface } from '../../lib/resource-interface.js';

class DevProxyResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
  }

  async shouldServe(url) {
    const proxies = this.compilation.config.devServer.proxy || {};
    const hasMatches = Object.entries(proxies).reduce((acc, entry) => {
      return acc || url.pathname.indexOf(entry[0]) >= 0;
    }, false);

    return url.protocol.startsWith('http:') && hasMatches;
  }

  async serve(url, request) {
    return fetch(request, {
      ...request
    });
  }
}

const greenwoodPluginDevProxy = {
  type: 'resource',
  name: 'plugin-dev-proxy',
  provider: (compilation, options) => new DevProxyResource(compilation, options)
};

export { greenwoodPluginDevProxy };