/* eslint-disable no-unused-vars */
const path = require('path');

// tranform.interface.js
module.exports = class TransformInterface {

  constructor(request, { context, config }, extensions) {
    this.extensions = extensions; // ['.foo', '.bar'] 
    this.workspace = context.userWorkspace; // greenwood
    this.scratchDir = context.scratchDir;
    this.request = request;
    this.config = config;
  }

  shouldTransform() {
    return this.extensions.indexOf(path.extname(this.request.url)) >= 0;
  }

  applyTransform() {
    // do stuff with path
  }
};