const path = require('path');

// who, what, where, when, why
// emit?  - or can that be done
// 1) resolve(url) (serve / rollup): where is it
//   - something that returns a new path that passes fs.existsSync and is absolute
//   - default is `${context.userWorkspace}/${url}`
//   - node resolve and workspace resolve plugins
// 2) serve(url): what is it
//   - for a valid path, returns source code (body and contentType) for the browser
// 3) intercept(url, body): what is it
//   - for a url, intercept it with a new body
//   - returns source code (body and contentType) for the browser
// 4) optimize(indexHtmlContents): do something after the build / serialize is done, e.g. 
//   - add GA, Polyfills
//   - all you get is in index.html, BYOA (bring your own parser)
// - still need `shouldXXX()` methods?
// - path vs url?

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
    // console.debug('SHOULD SERVE???????', url);
    // console.debug('this.extensions???????', this.extensions);
    // console.debug('y / n???????', this.extensions.indexOf(path.extname(url)));
    // return hasExtension || 
  }

  async resolve(url, headers) {
    return Promise.resolve(url);
  }

  // introduce a new resource type to the browser, on the fly, ex: `<script src="index.ts">`
  shouldServe(url, headers) {
    console.debug('SHOULD SERVE???????', url);
    console.debug('this.extensions???????', this.extensions);
    console.debug('y / n???????', this.extensions.indexOf(path.extname(url)));
    return this.extensions.indexOf(path.extname(url)) >= 0;
  }

  // eslint-disable-next-line no-unused-vars
  // hidden API?
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