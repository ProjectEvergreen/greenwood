import { greenwoodPluginGraphQL } from '../../../src/index.js';
import { greenwoodPluginRendererPuppeteer } from '@greenwood/plugin-renderer-puppeteer';

export default {

  plugins: [
    ...greenwoodPluginGraphQL(),
    ...greenwoodPluginRendererPuppeteer() // automatically invokes prerendering
  ]

};