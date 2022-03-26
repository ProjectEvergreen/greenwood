import { PolyfillsResource } from './polyfill-resource.js';

const greenwoodPluginRendererLit = (options = {}) => {
  return [{
    type: 'renderer',
    name: 'plugin-renderer-lit:renderer',
    provider: () => {
      return {
        workerUrl: new URL('./ssr-route-worker-lit.js', import.meta.url),
        prerender: options.prerender
      };
    }
  }, {
    type: 'resource',
    name: 'plugin-renderer-lit:resource',
    provider: (compilation) => new PolyfillsResource(compilation, options)
  }];
};

export {
  greenwoodPluginRendererLit
};