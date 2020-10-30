const path = require('path');
const { promises: fsp } = require('fs');
const TransformInterface = require('./transform.interface');

module.exports = class TransformHtml extends TransformInterface {

  constructor(req, compilation) {
    super(req, compilation, ['.js']);
  }

  shouldTransform() {
    return this.request.url.indexOf('/node_modules') >= 0;
  }

  async applyTransform() {
    let { url } = this.request;
    return new Promise(async (resolve, reject) => {
      try {
        const modulePath = path.join(process.cwd(), url);
        const body = await fsp.readFile(modulePath, 'utf-8'); // have to handle CJS vs ESM?
        const contentType = url.indexOf('.js') > 0
          ? 'text/javascript'
          : 'text/css'; // TODO eve components assume a bundler
        
        resolve({
          body,
          contentType,
          extension: '.js'
        });
      } catch (e) {
        reject(e);
      }
    });
  }
};