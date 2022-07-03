import path from 'path';
import { ResourceInterface } from '@greenwood/cli/src/lib/resource-interface.js';

class StandardHtmlResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);

    this.extensions = ['.html'];
    this.contentType = 'text/html';
  }

  async shouldIntercept(url, body, headers = {}) {
    const shouldIntercept = url.endsWith('/') && headers.request && headers.request.accept.indexOf(this.contentType) >= 0;
  
    return process.env.__GWD_COMMAND__ === 'build' && shouldIntercept;// eslint-disable-line no-underscore-dangle
  }

  async intercept(url, body) {
    body = body.replace('<head>', `
      <head>
        <script src="/node_modules/@webcomponents/webcomponentsjs/webcomponents-bundle.js"></script>
    `);

    return Promise.resolve({ body });
  }

  async shouldOptimize(url = '', body, headers = {}) {
    return Promise.resolve(path.extname(url) === '.html' || (headers.request && headers.request['content-type'].indexOf(this.contentType) >= 0));
  }

  async optimize(url, body) {
    return new Promise((resolve, reject) => {
      try {
        const hasHead = body.match(/\<head>(.*)<\/head>/s);

        if (hasHead && hasHead.length > 0) {
          body = body.replace(/<script src="(.*webcomponents-bundle.js)"><\/script>/, '');
        }

        resolve(body);
      } catch (e) {
        reject(e);
      }
    });
  }
}
const greenwoodPluginRendererPuppeteer = (options = {}) => {
  return [{
    type: 'resource',
    name: 'plugin-renderer-puppeteer:resource',
    provider: (compilation) => new StandardHtmlResource(compilation, options)
  }];
};

export {
  greenwoodPluginRendererPuppeteer
};