const path = require('path');
const { promises: fsp } = require('fs');
const TransformInterface = require('./transform.interface');

module.exports = class TransformHtml extends TransformInterface {

  constructor(req, compilation) {
    super(req, compilation, ['.js']);
  }

  shouldTransform() {
    const { url } = this.request;

    return this.extensions.indexOf(path.extname(url)) >= 0 &&
      url.indexOf('/node_modules') < 0 && url.indexOf('.json') < 0;
  }

  async applyTransform() {
    return new Promise(async (resolve, reject) => {
      try {

        const jsPath = path.join(this.workspace, this.request.url);
        const body = await fsp.readFile(jsPath, 'utf-8');
        resolve({
          body,
          contentType: 'text/javascript',
          extension: '.js'
        });
      } catch (e) {
        reject(e);
      }
    });
  }
};