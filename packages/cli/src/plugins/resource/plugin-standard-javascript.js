/*
 * 
 * Manages web standard resource related operations for JavaScript.
 * This is a Greenwood default plugin.
 *
 */
import fs from 'fs';
import { ResourceInterface } from '../../lib/resource-interface.js';
import { terser } from 'rollup-plugin-terser';

class StandardJavaScriptResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['.js'];
    this.contentType = 'text/javascript';
  }

  async serve(url) {
    return new Promise(async(resolve, reject) => {
      try {
        const body = await fs.promises.readFile(url, 'utf-8');
    
        resolve({
          body,
          contentType: this.contentType
        });
      } catch (e) {
        reject(e);
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