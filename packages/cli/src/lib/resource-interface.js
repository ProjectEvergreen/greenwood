const path = require('path');

class ResourceInterface {
  constructor(compilation, options = {}) {
    this.compilation = compilation;
    this.options = options;
    this.extensions = [];
    this.contentType = undefined;
  }

  // introduce a new resource type to the browser, on the fly, ex: `<script src="index.ts">`
  shouldResolve(request) {
    return this.extensions.indexOf(path.extname(request.url)) >= 0;
  }

  // eslint-disable-next-line no-unused-vars
  resolve(request) {
    return false;
  }

  // handle an already resolved resource
  // eslint-disable-next-line no-unused-vars
  shouldIntercept(request) {
    return false;
  }

  // eslint-disable-next-line no-unused-vars
  intercept(request) {
    return false;
  }

  // handle a (final) resource type post build, pre optimize, ex: remove es shim <script>, convert .ts -> .js and update path references 
  // eslint-disable-next-line no-unused-vars
  shouldTransform(request) {
    return false;
  }

  // eslint-disable-next-line no-unused-vars
  transform (request) {
    return false;
  }
}

module.exports = {
  ResourceInterface
};