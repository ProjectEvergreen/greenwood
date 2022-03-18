import { greenwoodPluginImportCss } from '../../../src/index.js';

export default {
  prerender: true,

  plugins: [
    ...greenwoodPluginImportCss()
  ]
};