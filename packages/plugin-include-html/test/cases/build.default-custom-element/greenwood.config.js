import { greenwoodPluginIncludeHTML } from '../../../src/index.js';

export default {
  prerender: true, // TODO fix intercept not running when prerender: false

  plugins: [
    ...greenwoodPluginIncludeHTML()
  ]
};