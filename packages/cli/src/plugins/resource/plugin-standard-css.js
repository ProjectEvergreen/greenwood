/*
 * 
 * Manages web standard resource related operations for CSS.
 * This is a Greenwood default plugin.
 *
 */
import fs from 'fs';
import { parse, walk } from 'css-tree';
import path from 'path';
import { ResourceInterface } from '../../lib/resource-interface.js';

class StandardCssResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['.css'];
    this.contentType = 'text/css';
  }

  async serve(url) {
    return new Promise(async (resolve, reject) => {
      try {  
        const css = await fs.promises.readFile(url, 'utf-8');

        resolve({
          body: css,
          contentType: this.contentType
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  async shouldOptimize(url) {
    const isValidCss = path.extname(url) === this.extensions[0] && this.compilation.config.optimization !== 'none';
    
    return Promise.resolve(isValidCss);
  }

  async optimize(url, body) {
    return new Promise(async (resolve, reject) => {
      try {
        const ast = parse(body, { positions: true });
        let optimizedCss = '';

        walk(ast, function(node, item, list) { // eslint-disable-line
          const { type, loc } = node;

          if (type === 'Atrule') {
            optimizedCss += `${body.slice(loc.start.offset, loc.end.offset)} \n`;
          } else if (type === 'Rule' && !this.atrule) {
            optimizedCss += `${body.slice(loc.start.offset, loc.end.offset)} \n`;
          }
        });

        resolve(optimizedCss);
      } catch (e) {
        reject(e);
      }
    });
  }
}

const greenwoodPluginStandardCss = {
  type: 'resource',
  name: 'plugin-standard-css',
  provider: (compilation, options) => new StandardCssResource(compilation, options)
};

export { greenwoodPluginStandardCss };