import { greenwoodPluginTypeScript } from '../../../src/index.js';

export default {
  prerender: true,
  plugins: [
    greenwoodPluginTypeScript({
      // make sure we don't lose default value of servePage
      // https://github.com/ProjectEvergreen/greenwood/issues/1295
      foo: 'bar'
    })
  ]
};