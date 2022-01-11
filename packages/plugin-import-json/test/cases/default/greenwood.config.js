import { greenwoodPluginImportJson } from '../../../src/index.js';

export default {
  prerender: true,

  plugins: [
    ...greenwoodPluginImportJson()
  ]

};