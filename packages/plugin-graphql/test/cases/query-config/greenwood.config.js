import { greenwoodPluginGraphQL } from '../../../src/index.js';

export default {
  title: 'GraphQL ConfigQuery Spec',

  prerender: true,

  plugins: [
    ...greenwoodPluginGraphQL()
  ]

};