import { greenwoodPluginGraphQL } from '../../../src/index.js';

export default {
  title: 'GraphQL CHildrenQuery Spec',

  prerender: true,

  plugins: [
    ...greenwoodPluginGraphQL()
  ]

};