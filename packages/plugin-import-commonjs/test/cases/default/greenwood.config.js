import { greenwodPluginImportCommonJs } from '../../../src/index.js';

export default {
  prerender: true,

  plugins: [
    ...greenwodPluginImportCommonJs()
  ]
};