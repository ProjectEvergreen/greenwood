import { greenwoodPluginPolyfills } from '../../../src/index.js';

export default {
  plugins: [
    ...greenwoodPluginPolyfills({
      dsd: true,
      wc: false
    })
  ]
};