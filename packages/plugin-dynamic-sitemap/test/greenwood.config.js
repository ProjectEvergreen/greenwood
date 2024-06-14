import { greenwoodPluginDynamicExport } from '../src/index.js';

console.log(greenwoodPluginDynamicExport);
export default {
  plugins: [
    ...greenwoodPluginDynamicExport({
      'baseUrl': 'https://example.com'
    })
  ]
};