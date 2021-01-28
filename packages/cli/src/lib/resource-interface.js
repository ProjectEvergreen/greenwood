const path = require('path');

class ResourceInterface {
  constructor(compilation, options = {}) {
    this.compilation = compilation;
    this.options = options;
    this.extensions = [];
    this.contentType = '';
  }

  // resolve relative URLs from the browser to absolute path on disk
  // eslint-disable-next-line no-unused-vars
  async shouldResolve(url) {
    return Promise.resolve(false);
  }

  async resolve(url) {
    return Promise.resolve(url);
  }

  // introduce a new resource type to the browser, on the fly, ex: `<script src="index.ts">`
  // eslint-disable-next-line no-unused-vars
  async shouldServe(url, headers) {
    return Promise.resolve(this.extensions.indexOf(path.extname(url)) >= 0);
  }

  // eslint-disable-next-line no-unused-vars
  async serve(url, headers) {
    return Promise.resolve({});
  }

  // handle an already resolved / served resource
  // eslint-disable-next-line no-unused-vars
  async shouldIntercept(url, headers) {
    return Promise.resolve(false);
  }

  // eslint-disable-next-line no-unused-vars
  async intercept(contents, headers) {
    return Promise.resolve(contents);
  }

  // handle a (final) resource type post build, pre optimize, 
  // ex: remove es shim <script>, convert .ts -> .js and update path references 
  // this is only an _index.html_ file, BYOA (Bring Your Own AST)
  // eslint-disable-next-line no-unused-vars
  shouldOptimize(contents, url) {
    return false;
  }

  // eslint-disable-next-line no-unused-vars
  async optimize (contents, url) {
    return Promise.resolve(contents);
  }
}

module.exports = {
  ResourceInterface
};