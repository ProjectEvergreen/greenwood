import { greenwoodPluginAdapterVercel } from '../../../src/index.js';

export default {
  basePath: '/my-app',
  plugins: [
    greenwoodPluginAdapterVercel()
  ]
};