class ResourceInterface {
  constructor(compilation, options = {}) {
    this.type = 'resource';
    this.extensions = [];
    this.contentType = '';
    this.compilation = compilation;
    this.options = options;
  }

  // introduce a new resource type to the browser, on the fly, ex: `<script src="index.ts">`
  // shouldServe(request) {

  // }

  // serve(request) {

  // }

  // handle an existing resource type to the browser, similar to serve, on the fly, ex: index.html, to add `importMap` or GA
  // shouldFilter() {

  // }

  // filter() {

  // }

  // handle a (final) resource type post build, pre optimize, ex: remove es shim <script>, convert .ts -> .js and update path references 
  // shouldTransform() {

  // }

  // transform () {

  // }
}

module.exports = {
  ResourceInterface
};