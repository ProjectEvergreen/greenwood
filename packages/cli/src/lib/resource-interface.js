class ResourceInterface {
  constructor(compilation, options = {}) {
    this.extensions = [];
    this.contentType = '';
    this.compilation = compilation;
    this.options = options;
  }

  // introduce a new resource type to the browser, on the fly, ex: `<script src="index.ts">`
  shouldResolve(request) {
    return false;
  }

  resolve(request) {
    return false;
  }

  // handle an already resolved resource
  shouldIntercept(request) {
    return false;
  }

  intercept(request) {
    return false;
  }

  // handle a (final) resource type post build, pre optimize, ex: remove es shim <script>, convert .ts -> .js and update path references 
  shouldTransform(request) {
    return false;
  }

  transform (request) {
    return false;
  }
}

module.exports = {
  ResourceInterface
};