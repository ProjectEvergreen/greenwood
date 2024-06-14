import { greenwoodPluginDynamicExport } from '../src/index.js';

console.log(greenwoodPluginDynamicExport);
export default {
  plugins: [
    ...greenwoodPluginDynamicExport({
      "base_url": "https://example.com"
    })
  ]
};