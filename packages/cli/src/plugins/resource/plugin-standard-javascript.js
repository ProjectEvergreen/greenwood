/*
 *
 * Manages web standard resource related operations for JavaScript.
 * This is a Greenwood default plugin.
 *
 */
import fs from 'fs/promises';
import { ResourceInterface } from '../../lib/resource-interface.js';
import terser from '@rollup/plugin-terser';
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';
import { importAttributes } from 'acorn-import-attributes';

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

  async shouldPreIntercept(url) {
    return url.protocol === 'file:' && this.extensions.includes(url.pathname.split('.').pop());
  }

  async preIntercept(url) {
    const { polyfills } = this.compilation.config;
    let body = await fs.readFile(url, 'utf-8');

    if (polyfills.importAttributes) {
      walk.simple(acorn.Parser.extend(importAttributes).parse(body, {
        ecmaVersion: 'latest',
        sourceType: 'module'
      }), {
        async ImportDeclaration(node) {
          const line = body.slice(node.start, node.end);
          const { value } = node.source;

          polyfills.importAttributes.forEach((attribute) => {
            if (line.replace(/ /g, '').replace(/"/g, '\'').includes(`with{type:'${attribute}'}`)) {
              body = body.replace(line, `${line.split('with')[0]};\n`);
              body = body.replace(value, `${value}?polyfill=type-${attribute}`);
            }
          });
        }
      });
    }

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