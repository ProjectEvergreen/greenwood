import { ResourceInterface } from '@greenwood/cli/src/lib/resource-interface.js';

class PuppeteerResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);

    this.extensions = ['.html'];
    this.contentType = 'text/html';
  }

  async shouldIntercept(url, request, response) {
    const { protocol } = url;

    return process.env.__GWD_COMMAND__ === 'build' // eslint-disable-line no-underscore-dangle
      && protocol.startsWith('http')
      && response.headers.get('content-type').indexOf(this.contentType) >= 0;
  }

  async intercept(url, request, response) {
    let body = await response.text();

    body = body.replace('<head>', `
      <head>
        <script src="/node_modules/@webcomponents/webcomponentsjs/webcomponents-bundle.js"></script>
    `);

    return new Response(body, {
      headers: response.headers
    });
  }
}

export { PuppeteerResource };