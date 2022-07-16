import { greenwoodPluginGraphQL } from '../../../src/index.js';
import { greenwoodPluginRendererPuppeteer } from '@greenwood/plugin-renderer-puppeteer';

export default {
  title: 'GraphQL ChildrenQuery Spec',

  plugins: [
    ...greenwoodPluginGraphQL(),
    ...greenwoodPluginRendererPuppeteer() // automatically invokes prerendering
  ]

};