const path = require('path');

class ResourceInterface {
  constructor(compilation, options = {}) {
    this.compilation = compilation;
    this.options = options;
    this.extensions = [];
    this.contentType = undefined;
  }

  shouldResolve(url) {
    const { extensions } = this;
    
    return extensions.length && extensions.length > 0 
      || extensions[0] === '*' 
      || extensions.indexOf(path.extname(url) >= 0);
  }

  async resolve(url) {
    return Promise.resolve(url);
  }

  // introduce a new resource type to the browser, on the fly, ex: `<script src="index.ts">`
  // eslint-disable-next-line no-unused-vars
  shouldServe(url, headers) {
    return this.extensions.indexOf(path.extname(url)) >= 0;
  }

  // hidden API?
  // eslint-disable-next-line no-unused-vars
  async serve(url, headers) {
    return Promise.resolve(url);
  }

  // handle an already resolved resource
  // eslint-disable-next-line no-unused-vars
  shouldInterceptl(url, headers) {
    return false;
  }

  // eslint-disable-next-line no-unused-vars
  async intercept(url, headers) {
    return Promise.resolve(url);
  }

  // handle a (final) resource type post build, pre optimize, 
  // ex: remove es shim <script>, convert .ts -> .js and update path references 
  // this is only an _index.html_ file, BYOA (Bring Your Own AST)
  // eslint-disable-next-line no-unused-vars
  shouldOptimize(file) {
    return false;
  }

  // eslint-disable-next-line no-unused-vars
  async optimize (file) {
    return Promise.resolve(url);
  }
}

module.exports = {
  ResourceInterface
};