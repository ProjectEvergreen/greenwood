/*
 *
 * Manages web standard resource related operations for CSS.
 * This is a Greenwood default plugin.
 *
 */
import fs from 'fs';
import path from 'path';
import { parse, walk } from 'css-tree';
import { ResourceInterface } from '../../lib/resource-interface.js';
import { hashString } from '../../lib/hashing-utils.js';

function bundleCss(body, url, compilation) {
  const { projectDirectory, outputDir, userWorkspace } = compilation.context;
  const ast = parse(body, {
    onParseError(error) {
      console.log(error.formattedMessage);
    }
  });
  let optimizedCss = '';

  walk(ast, {
    enter: function (node, item) { // eslint-disable-line complexity
      const { type, name, value, children } = node;

      if ((type === 'String' || type === 'Url') && this.atrulePrelude && this.atrule.name === 'import') {
        const { value } = node;

        if (value.indexOf('.') === 0 || value.indexOf('/node_modules') === 0) {
          const resolvedUrl = value.startsWith('/node_modules')
            ? new URL(`.${value}`, projectDirectory)
            : new URL(value, url);
          const importContents = fs.readFileSync(resolvedUrl, 'utf-8');

          optimizedCss += bundleCss(importContents, url, compilation);
        } else {
          optimizedCss += `@import url('${value}');`;
        }
      } else if (type === 'Url' && this.atrule?.name !== 'import') {
        if (value.startsWith('http') || value.startsWith('//') || value.startsWith('data:')) {
          optimizedCss += `url('${value}')`;
          return;
        }

        const basePath = compilation.config.basePath === '' ? '/' : `${compilation.config.basePath}/`;
        let barePath = value.replace(/\.\.\//g, '').replace('./', '');

        if (barePath.startsWith('/')) {
          barePath = barePath.replace('/', '');
        }

        const locationUrl = barePath.startsWith('node_modules')
          ? new URL(`./${barePath}`, projectDirectory)
          : new URL(`./${barePath}`, userWorkspace);

        if (fs.existsSync(locationUrl)) {
          const hash = hashString(fs.readFileSync(locationUrl, 'utf-8'));
          const ext = barePath.split('.').pop();
          const hashedRoot = barePath.replace(`.${ext}`, `.${hash}.${ext}`);

          fs.mkdirSync(new URL(`./${path.dirname(barePath)}/`, outputDir), {
            recursive: true
          });

          fs.promises.copyFile(
            locationUrl,
            new URL(`./${hashedRoot}`, outputDir)
          );

          optimizedCss += `url('${basePath}${hashedRoot}')`;
        } else {
          console.warn(`Unable to locate ${value}.  You may need to manually copy this file from its source location to the build output directory.`);
          optimizedCss += `url('${value}')`;
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

        if (children) {
          switch (name) {

            case 'dir':
            case 'host':
            case 'is':
            case 'has':
            case 'lang':
            case 'not':
            case 'nth-child':
            case 'nth-last-child':
            case 'nth-of-type':
            case 'nth-last-of-type':
            case 'where':
              optimizedCss += '(';
              break;
            default:
              break;

          }
        }
      } else if (type === 'PseudoElementSelector') {
        optimizedCss += `::${name}`;

        switch (name) {

          case 'highlight':
          case 'part':
          case 'slotted':
            optimizedCss += '(';
            break;
          default:
            break;

        }
      } else if (type === 'Function') {
        /* ex: border-left: 3px solid var(--color-secondary); */
        if (this.declaration && item.prev && (item.prev.data.type !== 'Operator' && item.prev.data.type !== 'Url')) {
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
          if (node.children) {
            switch (node.name) {

              case 'dir':
              case 'host':
              case 'is':
              case 'has':
              case 'lang':
              case 'not':
              case 'nth-child':
              case 'nth-last-child':
              case 'nth-last-of-type':
              case 'nth-of-type':
              case 'where':
                optimizedCss += ')';
                break;
              default:
                break;

            }
          }
          break;
        case 'PseudoElementSelector':
          switch (node.name) {

            case 'highlight':
            case 'part':
            case 'slotted':
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
    const body = await fs.promises.readFile(url, 'utf-8');

    return new Response(body, {
      headers: {
        'Content-Type': this.contentType
      }
    });
  }

  async shouldIntercept(url) {
    const { pathname } = url;
    const ext = pathname.split('.').pop();

    return url.protocol === 'file:' && ext === this.extensions[0];
  }

  async intercept(url, request, response) {
    let body = await response.text();
    let headers = {};

    if (request.headers.get('Accept')?.indexOf('text/javascript') >= 0 && !url.searchParams.has('type')) {
      const contents = body.replace(/\r?\n|\r/g, ' ').replace(/\\/g, '\\\\');

      body = `const sheet = new CSSStyleSheet();sheet.replaceSync(\`${contents}\`);export default sheet;`;
      headers['Content-Type'] = 'text/javascript';
    }

    return new Response(body, { headers });
  }

  async shouldOptimize(url, response) {
    const { protocol, pathname, searchParams } = url;
    const isValidCss = pathname.split('.').pop() === this.extensions[0]
      && protocol === 'file:'
      && response.headers.get('Content-Type').indexOf(this.contentType) >= 0
      && searchParams.get('type') !== 'css';

    return this.compilation.config.optimization !== 'none' && isValidCss;
  }

  async optimize(url, response) {
    const body = await response.text();
    const optimizedBody = bundleCss(body, url, this.compilation);

    return new Response(optimizedBody);
  }
}

const greenwoodPluginStandardCss = {
  type: 'resource',
  name: 'plugin-standard-css',
  provider: (compilation, options) => new StandardCssResource(compilation, options)
};

export { greenwoodPluginStandardCss };