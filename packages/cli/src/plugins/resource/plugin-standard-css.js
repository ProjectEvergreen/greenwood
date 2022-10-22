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

  walk(ast, {
    enter: function (node, item) { // eslint-disable-line complexity
      const { type, name, value } = node;

      if ((type === 'String' || type === 'Url') && this.atrulePrelude && this.atrule.name === 'import') {
        const { value } = node;

        if (value.indexOf('.') === 0) {
          const importContents = fs.readFileSync(path.resolve(path.dirname(url), value), 'utf-8');

          optimizedCss += bundleCss(importContents, url);
        }
      } else if (type === 'Atrule' && name !== 'import') {
        optimizedCss += `@${name} `;
      } else if (type === 'TypeSelector') {
        optimizedCss += name;
      } else if (type === 'IdSelector') {
        optimizedCss += `#${name}`;
      } else if (type === 'ClassSelector') {
        optimizedCss += `.${name}`;
      } else if (type === 'PseudoClassSelector') {
        optimizedCss += `:${name}`;

        switch (name) {

          case 'lang':
          case 'not':
          case 'nth-child':
          case 'nth-last-child':
          case 'nth-of-type':
          case 'nth-last-of-type':
            optimizedCss += '(';
            break;
          default:
            break;

        }
      } else if (type === 'Function') {
        optimizedCss += `${name}(`;
      } else if (type === 'MediaFeature') {
        optimizedCss += ` (${name}:`;
      } else if (type === 'PseudoElementSelector') {
        optimizedCss += `::${name}`;
      } else if (type === 'Block') {
        optimizedCss += '{';
      } else if (type === 'AttributeSelector') {
        optimizedCss += '[';
      } else if (type === 'Combinator') {
        optimizedCss += name;
      } else if (type === 'Nth') {
        const { nth } = node;

        switch (nth.type) {

          case 'AnPlusB':
            if (nth.a) {
              optimizedCss += nth.a === '-1' ? '-n' : `${nth.a}n`;
            }
            if (nth.b) {
              optimizedCss += nth.a ? `+${nth.b}` : nth.b;
            }
            break;
          default:
            break;

        }
      } else if (type === 'Declaration') {
        optimizedCss += `${node.property}:`;
      } else if (type === 'Url' && this.atrule?.name !== 'import') {
        optimizedCss += `url('${node.value}')`;
      } else if (type === 'Identifier' || type === 'Hash' || type === 'Dimension' || type === 'Number' || (type === 'String' && (this.atrule?.type !== 'import')) || type === 'Operator' || type === 'Raw' || type === 'Percentage') { // eslint-disable-line max-len
        if (item && item.prev && type !== 'Operator' && item.prev.data.type !== 'Operator') {
          optimizedCss += ' ';
        }

        switch (type) {

          case 'Dimension':
            optimizedCss += `${value}${node.unit}`;
            break;
          case 'Percentage':
            optimizedCss += `${value}%`;
            break;
          case 'Hash':
            optimizedCss += `#${value}`;
            break;
          case 'Identifier':
            optimizedCss += name;
            break;
          case 'Number':
            optimizedCss += value;
            break;
          case 'Operator':
            optimizedCss += value;
            break;
          case 'String':
            optimizedCss += `'${value}'`;
            break;
          case 'Raw':
            optimizedCss += `${value.trim()}`;
            break;
          default:
            break;

        }
      }
    },
    leave: function(node, item) {
      switch (node.type) {

        case 'Atrule':
          if (node.name !== 'import') {
            optimizedCss += '}';
          }
          break;
        case 'Rule':
          optimizedCss += '}';
          break;
        case 'Function':
        case 'MediaFeature':
          optimizedCss += ')';
          break;
        case 'PseudoClassSelector':
          switch (node.name) {

            case 'lang':
            case 'not':
            case 'nth-child':
            case 'nth-last-child':
            case 'nth-last-of-type':
            case 'nth-of-type':
              optimizedCss += ')';
              break;
            default:
              break;

          }
          break;
        case 'Declaration':
          if (node.important) {
            optimizedCss += '!important';
          }

          optimizedCss += ';';
          break;
        case 'Selector':
          if (item.next) {
            optimizedCss += ',';  
          }
          break;
        case 'AttributeSelector':
          if (node.matcher) {
            // TODO better way to do this?
            // https://github.com/csstree/csstree/issues/207
            optimizedCss = optimizedCss.replace(`${node.name.name}'${node.value.value}'`, `${node.name.name}${node.matcher}'${node.value.value}'`);
          }
          optimizedCss += ']';
          break;
        default:
          break;

      }
    }
  });

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