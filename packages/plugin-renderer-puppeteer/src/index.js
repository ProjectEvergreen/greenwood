import { PuppeteerResource } from './plugins/resource.js';
import { PuppeteerServer } from './plugins/server.js';

const greenwoodPluginRendererPuppeteer = (options = {}) => {
  return [{
    type: 'resource',
    name: 'plugin-renderer-puppeteer:resource',
    provider: (compilation) => new PuppeteerResource(compilation, options)
  }, {
    type: 'server',
    name: 'plugin-renderer-puppeteer:server',
    provider: (compilation) => new PuppeteerServer(compilation, options)
  }, {
    type: 'renderer',
    name: 'plugin-renderer-puppeteer:renderer',
    provider: () => {
      return {
        customUrl: new URL('./puppeteer-handler.js', import.meta.url),
        prerender: true
      };
    }
  }];
};

export {
  greenwoodPluginRendererPuppeteer
};