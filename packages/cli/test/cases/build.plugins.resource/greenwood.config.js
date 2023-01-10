import fs from 'fs/promises';
import { ResourceInterface } from '../../../src/lib/resource-interface.js';

class FooResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    
    this.extensions = ['foo'];
    this.contentType = 'text/javascript';
  }

  async shouldServe(url) {
    return url.pathname.split('.').pop() === this.extensions[0];
  }

  async serve(url) {
    let body = await fs.readFile(url, 'utf-8');

    body = body.replace(/interface (.*){(.*)}/s, '');

    return new Response(body, {
      headers: {
        'content-type': this.contentType
      }
    });
  }
}

export default {
  plugins: [{
    type: 'resource',
    name: 'plugin-foo',
    provider: (compilation, options) => new FooResource(compilation, options)
  }]
};