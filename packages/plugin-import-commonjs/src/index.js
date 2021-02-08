/*
 * 
 * Detects and fully resolves import requests for CommonJS files in node_modules.
 *
 */
const fs = require('fs');
const path = require('path');
const { ResourceInterface } = require('@greenwood/cli/src/lib/resource-interface');
const { parse } = require('cjs-module-lexer');
const rollupStream = require('@rollup/stream');
const commonjs = require('@rollup/plugin-commonjs');

// bit of a workaround for now, but maybe this could be supported by cjs-module-lexar natively?
// https://github.com/guybedford/cjs-module-lexer/issues/35
const testForCjsModule = async(url) => {
  let isCommonJs = false;

  if (path.extname(url) === '.js' && (/node_modules/).test(url) && url.indexOf('es-module-shims.js') < 0) {
    try {
      const body = await fs.promises.readFile(url, 'utf-8');
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

  return Promise.resolve(isCommonJs);
};

class ImportCommonJsResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
  }

  async shouldIntercept(url) {
    return new Promise(async (resolve, reject) => {
      try {
        const isCommonJs = await testForCjsModule(url);
        
        return resolve(isCommonJs);
      } catch (e) {
        console.error(e);
        reject(e);
      }
    });
  }

  async intercept(url) {
    return new Promise(async(resolve, reject) => {
      try {
        const options = {
          input: url,
          output: { format: 'esm' },
          plugins: [
            commonjs()
          ]
        };
        const stream = rollupStream(options);
        let bundle = '';

        stream.on('data', (data) => (bundle += data));
        stream.on('end', () => {
          resolve({
            body: bundle
          });
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}

module.exports = (options = {}) => {
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