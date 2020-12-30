/* eslint-disable no-unused-vars */
const path = require('path');

// tranform.interface.js
module.exports = class TransformInterface {

  constructor(request, compilation, { extensions = [], contentType = '' }) {
    const { context, config } = compilation;
    this.extensions = extensions; // ['.foo', '.bar'] 
    this.workspace = context.userWorkspace; // greenwood
    this.scratchDir = context.scratchDir;
    this.request = request;
    this.config = config;
    this.contentType = contentType;
  }

  getExtensions() {
    return this.extensions;
  }

  shouldTransform() {
    return this.extensions.indexOf(path.extname(this.request.url)) >= 0;
  }

  applyTransform() {
    // do stuff with path
  }
};