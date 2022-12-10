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
      return acc || url.indexOf(entry[0]) >= 0;
    }, false);

    return hasMatches;
  }

  async serve(url) {
    const baseUrl = url.replace(this.compilation.context.userWorkspace, '');
    const proxies = this.compilation.config.devServer.proxy;
    const proxyBaseUrl = Object.entries(proxies).reduce((acc, entry) => {
      return url.indexOf(entry[0]) >= 0
        ? `${entry[1]}${baseUrl}`
        : acc;
    }, baseUrl);

    const response = await fetch(proxyBaseUrl)
      .then(res => res.json());

    return Promise.resolve({
      body: response
    });
  }
}

const greenwoodPluginDevProxy = {
  type: 'resource',
  name: 'plugin-dev-proxy',
  provider: (compilation, options) => new DevProxyResource(compilation, options)
};

export { greenwoodPluginDevProxy };