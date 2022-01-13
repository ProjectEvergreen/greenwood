import { greenwoodPluginIncludeHTML } from '../../../src/index.js';

export default {
  prerender: false,
  plugins: [
    ...greenwoodPluginIncludeHTML()
  ]
};