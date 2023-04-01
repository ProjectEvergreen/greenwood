import fs from 'fs/promises';

// intentionally omitting `extends ResourceInterface` since it should still work the same
class FooResource {
  constructor(compilation, options) {
    this.compilation = compilation;
    this.options = options;
    
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
      headers: new Headers({
        'Content-Type': this.contentType
      })
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