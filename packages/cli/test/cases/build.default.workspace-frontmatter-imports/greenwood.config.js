import fs from 'fs/promises';

class NaiveTypeScriptResource {
  constructor(compilation, options) {
    this.compilation = compilation;
    this.options = options;

    this.extensions = ['ts'];
    this.contentType = 'text/javascript';
  }

  async shouldServe(url, request) {
    return url.pathname.split('.').pop() === this.extensions[0] && request.headers?.get('Accept').indexOf(this.contentType) >= 0;
  }

  async serve(url) {
    let body = await fs.readFile(url, 'utf-8');

    body = body.replace(': string', '');

    return new Response(body, {
      headers: new Headers({
        'Content-Type': this.contentType
      })
    });
  }
}

class NaiveSassResource {
  constructor(compilation, options) {
    this.compilation = compilation;
    this.options = options;

    this.extensions = ['scss'];
    this.contentType = 'text/css';
  }

  async shouldServe(url, request) {
    // console.log(url);
    // console.log('111', url.pathname.split('.').pop());
    // console.log('222', request.headers?.get('Accept'));
    // console.log('333', url.pathname.split('.').pop() === this.extensions[0]);
    // console.log('444', request.headers?.get('Accept').indexOf(this.contentType) >= 0);
    return url.pathname.split('.').pop() === this.extensions[0] && request.headers?.get('Accept').indexOf(this.contentType) >= 0;
  }

  async serve(url) {
    console.log('$$$$', url);
    let body = await fs.readFile(url, 'utf-8');

    body = body.replace('red', 'blue');
    // body = body.replace(/\\$my-color;/, 'red');
    console.log({ body });

    return new Response(body, {
      headers: new Headers({
        'Content-Type': this.contentType
      })
    });
  }
}

export default {
  prerender: true,
  plugins: [{
    type: 'resource',
    name: 'plugin-naive-ts',
    provider: (compilation) => new NaiveTypeScriptResource(compilation)
  }, {
    type: 'resource',
    name: 'plugin-naive-sass',
    provider: (compilation) => new NaiveSassResource(compilation)
  }]
};