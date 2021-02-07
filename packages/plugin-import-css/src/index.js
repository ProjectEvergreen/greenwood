
/*
 * 
 * Enables using JavaScript to import CSS files, using ESM syntax.
 *
 */
const path = require('path');
const postcssRollup = require('rollup-plugin-postcss');
const { ResourceInterface } = require('@greenwood/cli/src/lib/resource-interface');

class ImportCssResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['.css'];
    this.contentType = 'text/javascript';
  }

  async shouldIntercept(url, body, headers) {
    const isCssInJs = path.extname(url) === this.extensions[0] && headers.request['sec-fetch-dest'] === 'empty';

    return Promise.resolve(isCssInJs);
  }

  async intercept(url, body) {
    return new Promise(async (resolve, reject) => {
      try {
        const cssInJsBody = `const css = "${body.replace(/\r?\n|\r/g, ' ')}";\nexport default css;`;
        
        resolve({
          body: cssInJsBody,
          contentType: this.contentType
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
    name: 'plugin-import-css-resource',
    provider: (compilation) => new ImportCssResource(compilation, options)
  }, {
    type: 'rollup',
    name: 'plugin-import-css-rollup',
    provider: () => [
      postcssRollup({
        extract: false,
        minimize: true,
        inject: false
      })
    ]
  }];
};