import path from 'path';
import { ResourceInterface } from '@greenwood/cli/src/lib/resource-interface.js';

class PuppeteerResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);

    this.extensions = ['.html'];
    this.contentType = 'text/html';
  }

  async shouldIntercept(url, body, headers = {}) {
    const shouldIntercept = url.endsWith(path.sep) && headers.request && headers.request.accept.indexOf(this.contentType) >= 0;
  
    return process.env.__GWD_COMMAND__ === 'build' && shouldIntercept;// eslint-disable-line no-underscore-dangle
  }

  async intercept(url, body) {
    body = body.replace('<head>', `
      <head>
        <script src="/node_modules/@webcomponents/webcomponentsjs/webcomponents-bundle.js"></script>
    `);

    return Promise.resolve({ body });
  }
}

export { PuppeteerResource };