import { greenwoodPluginTypeScript } from '../../../src/index.js';

export default {
  prerender: true,
  plugins: [
    greenwoodPluginTypeScript({
      servePage: 'dynamic'
    })
  ]
};