const path = require('path');

class ResourceInterface {
  constructor(compilation, options = {}) {
    this.compilation = compilation;
    this.options = options;
    this.extensions = [];
    this.contentType = '';
  }

  // test if this plugin should change a relative URL from the browser to an absolute path on disk 
  // like for node_modules/ resolution. not commonly needed by most resource plugins
  // return true | false
  // eslint-disable-next-line no-unused-vars
  async shouldResolve(url) {
    return Promise.resolve(false);
  }

  // return an absolute path
  async resolve(url) {
    return Promise.resolve(url);
  }

  // test if this plugin should be used to process a given url / header combo the browser and retu
  // ex: `<script type="module" src="index.ts">`
  // return true | false
  // eslint-disable-next-line no-unused-vars
  async shouldServe(url, headers) {
    return Promise.resolve(this.extensions.indexOf(path.extname(url)) >= 0);
  }

  // return the new body and / or contentType, e.g. convert file.foo -> file.js
  // eslint-disable-next-line no-unused-vars
  async serve(url, headers) {
    return Promise.resolve({});
  }

  // test if this plugin should return a new body for an already resolved resource
  // useful for modifying code on the fly without needing to read the file from disk
  // return true | false
  // eslint-disable-next-line no-unused-vars
  async shouldIntercept(url, body, headers) {
    return Promise.resolve(false);
  }

  // return the new body
  // eslint-disable-next-line no-unused-vars
  async intercept(url, body, headers) {
    return Promise.resolve({ body });
  }

  // test if this plugin should manipulate any files prior to any final optmizations happening 
  // ex: add a "banner" to all .js files with a timestamp of the build, or minifying files
  // return true | false
  // eslint-disable-next-line no-unused-vars
  async shouldOptimize(url, body) {
    return Promise.resolve(false);
  }

  // return the new body
  // eslint-disable-next-line no-unused-vars
  async optimize (url, body) {
    return Promise.resolve(body);
  }
}

module.exports = {
  ResourceInterface
};