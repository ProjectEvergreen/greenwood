import { greenwoodPluginImportJsx } from '../../../src/index.js';

export default {
  prerender: true,
  plugins: [
    ...greenwoodPluginImportJsx()
  ]
};