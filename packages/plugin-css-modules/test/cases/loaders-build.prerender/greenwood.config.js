import fs from 'fs/promises';
import { greenwoodPluginCssModules } from '../../../src/index.js';
import { transform } from 'sucrase';

class NaiveTsResource {
  constructor(compilation, options) {
    this.compilation = compilation;
    this.options = options;

    this.extensions = ['ts'];
    this.contentType = 'text/javascript';
  }

  async shouldServe(url) {
    return url.pathname.split('.').pop() === this.extensions[0];
  }

  async serve(url) {
    const scriptContents = await fs.readFile(url, 'utf-8');
    const result = transform(scriptContents, {
      transforms: ['typescript', 'jsx'],
      jsxRuntime: 'preserve'
    });

    return new Response(result.code, {
      headers: new Headers({
        'Content-Type': this.contentType
      })
    });
  }
}

export default {
  prerender: true,
  plugins: [
    {
      type: 'resource',
      name: 'plugin-naive-ts',
      provider: (compilation, options) => new NaiveTsResource(compilation, options)
    },
    greenwoodPluginCssModules()
  ]
};