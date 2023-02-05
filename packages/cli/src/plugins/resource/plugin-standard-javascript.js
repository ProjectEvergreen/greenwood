/*
 * 
 * Manages web standard resource related operations for JavaScript.
 * This is a Greenwood default plugin.
 *
 */
import fs from 'fs/promises';
import { ResourceInterface } from '../../lib/resource-interface.js';
import terser from '@rollup/plugin-terser';

class StandardJavaScriptResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['js'];
    this.contentType = 'text/javascript';
  }

  async shouldServe(url) {
    return url.protocol === 'file:' && this.extensions.includes(url.pathname.split('.').pop());
  }

  async serve(url) {
    const body = await fs.readFile(url, 'utf-8');

    return new Response(body, {
      headers: {
        'Content-Type': this.contentType
      }
    });
  }
}

const greenwoodPluginStandardJavascript = [{
  type: 'resource',
  name: 'plugin-standard-javascript:resource',
  provider: (compilation, options) => new StandardJavaScriptResource(compilation, options)
}, {
  type: 'rollup',
  name: 'plugin-standard-javascript:rollup',
  provider: (compilation) => {
    return compilation.config.optimization !== 'none'
      ? [terser()]
      : [];
  }
}];

export { greenwoodPluginStandardJavascript };