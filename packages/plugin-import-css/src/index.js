
/*
 * 
 * Enables using JavaScript to import CSS files, using ESM syntax.
 *
 */
import fs from 'fs';
import path from 'path';
import { ResourceInterface } from '@greenwood/cli/src/lib/resource-interface.js';
import { pathToFileURL } from 'url';

class ImportCssResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['.css'];
    this.contentType = 'text/javascript';
  }

  // TODO resolve as part of https://github.com/ProjectEvergreen/greenwood/issues/952
  async shouldServe() {
    return false;
  }

  // https://github.com/ProjectEvergreen/greenwood/issues/700
  async shouldResolve(url) {
    const isCssInDisguise = url.endsWith(this.extensions[0]) && fs.existsSync(`${url}.js`);

    return Promise.resolve(isCssInDisguise);
  }

  async resolve(url) {
    return Promise.resolve(`${url}.js`);
  }

  async shouldIntercept(url, body, headers = { request: {} }) {
    const { originalUrl = '' } = headers.request;
    const accept = headers.request.accept || '';
    const isCssFile = path.extname(url) === this.extensions[0];
    const notFromBrowser = accept.indexOf('text/css') < 0 && accept.indexOf('application/signed-exchange') < 0;

    // https://github.com/ProjectEvergreen/greenwood/issues/492
    const isCssInJs = originalUrl.indexOf('?type=css') >= 0
      || isCssFile && notFromBrowser
      || isCssFile && notFromBrowser && url.indexOf('/node_modules/') >= 0;

    return Promise.resolve(isCssInJs);
  }

  async intercept(url, body) {
    return new Promise(async (resolve, reject) => {
      try {
        const finalBody = body || await fs.promises.readFile(pathToFileURL(url), 'utf-8');
        const cssInJsBody = `const css = \`${finalBody.replace(/\r?\n|\r/g, ' ').replace(/\\/g, '\\\\')}\`;\nexport default css;`;
        
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
  }];
};

export { greenwoodPluginImportCss };