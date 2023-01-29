/*
 * 
 * Enables using JavaScript to import CSS files, using ESM syntax.
 *
 */
import fs from 'fs/promises';
import { ResourceInterface } from '@greenwood/cli/src/lib/resource-interface.js';

class ImportCssResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['css'];
    this.contentType = 'text/javascript';
  }

  // https://github.com/ProjectEvergreen/greenwood/issues/700
  async shouldResolve(url) {
    try {
      if (url.pathname.endsWith(`.${this.extensions[0]}`)) {
        await fs.access(url);
        return true;
      }      
    } catch (error) {
      
    }
  }

  async resolve(url) {
    return new Request(`file://${url.pathname}.js`);
  }

  async shouldIntercept(url, request) {
    const { pathname } = url;
    const accepts = request.headers.get('accept') || '';
    const isCssFile = pathname.split('.').pop() === this.extensions[0];
    const notFromBrowser = accepts.indexOf('text/css') < 0 && accepts.indexOf('application/signed-exchange') < 0;

    // https://github.com/ProjectEvergreen/greenwood/issues/492
    const isCssInJs = url.searchParams.has('type') && url.searchParams.get('type') === this.extensions[0]
      || isCssFile && notFromBrowser
      || isCssFile && notFromBrowser && pathname.startsWith('/node_modules/');

    return isCssInJs;
  }

  async intercept(url, request, response) {
    const body = await response.text();
    const cssInJsBody = `const css = \`${body.replace(/\r?\n|\r/g, ' ').replace(/\\/g, '\\\\')}\`;\nexport default css;`;
    
    return new Response(cssInJsBody, {
      headers: new Headers({
        'Content-Type': this.contentType
      })
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