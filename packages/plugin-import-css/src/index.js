
/*
 * 
 * Enables using JavaScript to import CSS files, using ESM syntax.
 *
 */
import fs from 'fs';
import path from 'path';
import postcssRollup from 'rollup-plugin-postcss';
import { ResourceInterface } from '@greenwood/cli/src/lib/resource-interface.js';

class ImportCssResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['.css'];
    this.contentType = 'text/javascript';
  }

  // https://github.com/ProjectEvergreen/greenwood/issues/700
  async shouldResolve(url) {
    const isCssInDisguise = url.endsWith(this.extensions[0]) && fs.existsSync(`${url}.js`);

    return Promise.resolve(isCssInDisguise);
  }

  async resolve(url) {
    return Promise.resolve(`${url}.js`);
  }

  async shouldIntercept(url, body, headers) {
    const { originalUrl } = headers.request;

    // https://github.com/ProjectEvergreen/greenwood/issues/492
    const isCssInJs = (originalUrl && originalUrl.indexOf('?type=css') >= 0) 
      || (path.extname(url) === this.extensions[0]
        && headers.request.accept.indexOf('text/css') < 0
        && headers.request.accept.indexOf('application/signed-exchange') < 0);

    return Promise.resolve(isCssInJs);
  }

  async intercept(url, body) {
    return new Promise(async (resolve, reject) => {
      try {
        const cssInJsBody = `const css = \`${body.replace(/\r?\n|\r/g, ' ').replace(/\\/g, '\\\\')}\`;\nexport default css;`;
        
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

const greenwoodPluginImportCss = (options = {}) => {
  return [{
    type: 'resource',
    name: 'plugin-import-css:resource',
    provider: (compilation) => new ImportCssResource(compilation, options)
  }, {
    type: 'rollup',
    name: 'plugin-import-css:rollup',
    provider: () => [
      postcssRollup({
        extract: false,
        minimize: true,
        inject: false
      })
    ]
  }];
};

export { greenwoodPluginImportCss };