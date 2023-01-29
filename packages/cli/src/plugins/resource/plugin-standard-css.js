/*
 *
 * Manages web standard resource related operations for CSS.
 * This is a Greenwood default plugin.
 *
 */
import fs from 'fs/promises';
import { parse, walk } from 'css-tree';
import { ResourceInterface } from '../../lib/resource-interface.js';

function bundleCss(body, url, projectDirectory) {
  const ast = parse(body, {
    onParseError(error) {
      console.log(error.formattedMessage);
    }
  });
  let optimizedCss = '';

  walk(ast, {
    enter: function (node, item) { // eslint-disable-line complexity
      const { type, name, value } = node;

      if ((type === 'String' || type === 'Url') && this.atrulePrelude && this.atrule.name === 'import') {
        const { value } = node;

        if (value.indexOf('.') === 0 || value.indexOf('/node_modules') === 0) {
          const resolvedUrl = value.startsWith('/node_modules')
            ? new URL(`.${value}`, projectDirectory)
            : new URL(value, url);
          const importContents = fs.readFile(resolvedUrl, 'utf-8');

          optimizedCss += bundleCss(importContents, url, projectDirectory);
        } else {
          optimizedCss += `@import url('${value}');`;
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
        /* ex: border-left: 3px solid var(--color-secondary); */
        if (this.declaration && item.prev && item.prev.data.type === 'Identifier') {
          optimizedCss += ' ';
        }
        optimizedCss += `${name}(`;
      } else if (type === 'MediaFeature') {
        optimizedCss += ` (${name}:`;
      } else if (type === 'Parentheses') {
        optimizedCss += '(';
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
    leave: function(node, item) { // eslint-disable-line complexity
      switch (node.type) {

        case 'Atrule':
          if (!node.block && node.name !== 'import') {
            optimizedCss += ';';
          }
          break;
        case 'Block':
          optimizedCss += '}';
          break;
        case 'Function':
        case 'MediaFeature':
        case 'Parentheses':
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

          if (item.next || (item.prev && !item.next)) {
            optimizedCss += ';';
          }

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
            const name = node.name.name;
            const value = node.value.type === 'Identifier' ? node.value.name : `'${node.value.value}'`;

            optimizedCss = optimizedCss.replace(`${name}${value}`, `${name}${node.matcher}${value}`);
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
    this.extensions = ['css'];
    this.contentType = 'text/css';
  }

  async shouldServe(url) {
    return url.protocol === 'file:' && this.extensions.indexOf(url.pathname.split('.').pop()) >= 0;
  }

  async serve(url) {
    const body = await fs.readFile(url, 'utf-8');

    return new Response(body, {
      headers: {
        'Content-Type': this.contentType
      }
    });
  }

  async shouldOptimize(url, response) {
    const { protocol, pathname } = url;
    const isValidCss = pathname.split('.').pop() === this.extensions[0]
      && protocol === 'file:'
      && response.headers.get('Content-Type').indexOf(this.contentType) >= 0;

    return this.compilation.config.optimization !== 'none' && isValidCss;
  }

  async optimize(url, response) {
    const body = await response.text();
    const optimizedBody = bundleCss(body, url, this.compilation.context.projectDirectory);

    return new Response(optimizedBody);
  }
}

const greenwoodPluginStandardCss = {
  type: 'resource',
  name: 'plugin-standard-css',
  provider: (compilation, options) => new StandardCssResource(compilation, options)
};

export { greenwoodPluginStandardCss };