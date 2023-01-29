/*
 * 
 * Detects and fully resolves import requests for CommonJS files in node_modules.
 *
 */
import commonjs from '@rollup/plugin-commonjs';
import fs from 'fs/promises';
import { parse, init } from 'cjs-module-lexer';
import { ResourceInterface } from '@greenwood/cli/src/lib/resource-interface.js';
import rollupStream from '@rollup/stream';

// bit of a workaround for now, but maybe this could be supported by cjs-module-lexar natively?
// https://github.com/guybedford/cjs-module-lexer/issues/35
const testForCjsModule = async(url) => {
  const { pathname } = url;
  let isCommonJs = false;

  if (pathname.split('.').pop() === '.js' && pathname.startsWith('/node_modules/') && pathname.indexOf('es-module-shims.js') < 0) {
    try {
      await init();
      const body = await fs.readFile(url, 'utf-8');
      await parse(body);

      isCommonJs = true;
    } catch (e) {
      const { message } = e;
      const isProbablyLexarErrorSoIgnore = message.indexOf('Unexpected import statement in CJS module.') >= 0 
        || message.indexOf('Unexpected export statement in CJS module.') >= 0;

      if (!isProbablyLexarErrorSoIgnore) {
        // we probably _shouldn't_ ignore this, so let's log it since we don't want to swallow all errors
        console.error(e);
      }
    }
  }

  return isCommonJs;
};

class ImportCommonJsResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
  }

  async shouldIntercept(url) {
    return await testForCjsModule(url);
  }

  async intercept(url) {
    const { pathname } = url;
    
    return new Promise(async(resolve, reject) => {
      try {
        const options = {
          input: pathname,
          output: { format: 'esm' },
          plugins: [
            commonjs()
          ]
        };
        const stream = rollupStream(options);
        let bundle = '';

        stream.on('data', (data) => (bundle += data));
        stream.on('end', () => {
          console.debug(`processed module "${pathname}" as a CommonJS module type.`);
          resolve(new Response(bundle, {
            headers: response.headers
          }));
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}

const greenwoodPluginImportCommonJs = (options = {}) => {
  return [{
    type: 'resource',
    name: 'plugin-import-commonjs:resource',
    provider: (compilation) => new ImportCommonJsResource(compilation, options)
  }, {
    type: 'rollup',
    name: 'plugin-import-commonjs:rollup',
    provider: () => [
      commonjs()
    ]
  }];
};

export {
  greenwoodPluginImportCommonJs
};