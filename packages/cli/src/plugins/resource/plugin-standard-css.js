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

function bundleCss(body, url) {
  const ast = parse(body);
  let optimizedCss = '';

  walk(ast, function(node, item, list) { // eslint-disable-line
    const { type } = node;

    if (type === 'String' && this.atrulePrelude) {
      const { value } = item.data;

      if (value.indexOf('.') === 0) {
        const importContents = fs.readFileSync(path.resolve(path.dirname(url), value), 'utf-8');

        optimizedCss += bundleCss(importContents, url);
      }
    } else if (type === 'Rule' && item.prev && item.prev.data.type !== 'Atrule') {
      optimizedCss += '}';
    } if (type === 'TypeSelector') {
      optimizedCss += `${node.name}`;
    } if (type === 'PseudoClassSelector') {
      optimizedCss += `:${node.name}`;
    } if (type === 'Selector') {
      if (item.prev) {
        optimizedCss += ',';
      }
    } if (type === 'Function') {
      optimizedCss += `${node.name}(`;
    } else if (type === 'Declaration') {
      if (!item.prev) {
        optimizedCss += '{';
      }

      optimizedCss += `${node.property}:`;

      if (node.value.type === 'Raw') {
        optimizedCss += node.value.value.trim();

        if (item.next) {
          optimizedCss += ';';
        }
      }
    } else if (type === 'Identifier' || type === 'Hash' || type === 'Dimension' || type === 'Number' || (type === 'String' && !this.atrule) || type === 'Operator') {
      if (item.prev && type !== 'Operator' && item.prev.data.type !== 'Operator') {
        optimizedCss += ' ';
      }

      switch (type) {

        case 'Dimension':
          optimizedCss += `${node.value}${node.unit}`;
          break;
        case 'Hash':
          optimizedCss += `#${node.value}`;
          break;
        case 'Identifier':
          optimizedCss += `${node.name}`;
          if (this.function) {
            optimizedCss += ')';
          }
          break;
        case 'Number':
          optimizedCss += `${node.value}`;
          break;
        case 'Operator':
          optimizedCss += `${node.value}`;
          break;
        case 'String':
          optimizedCss += `'${node.value}'`;
          break;
        default:
          break;

      }

      if (!item.next) {
        optimizedCss += ';';
      }
    }
  });

  optimizedCss += '}';

  return optimizedCss;
}
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
        resolve(bundleCss(body, url));
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