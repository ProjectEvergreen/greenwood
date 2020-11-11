const path = require('path');
const { promises: fsp } = require('fs');
const TransformInterface = require('./transform.interface');

class JSTransform extends TransformInterface {

  constructor(req) {
    super(req, ['.js'], 'text/javascript');
  }

  shouldTransform() {
    const { url } = this.request;

    return this.extensions.indexOf(path.extname(url)) >= 0 && url.indexOf('.json') < 0;
  }

  async applyTransform() {
    return new Promise(async (resolve, reject) => {
      try {
        const { url } = this.request;
        const jsPath = url.indexOf('/node_modules') >= 0
          ? path.join(process.cwd(), url)
          : path.join(this.workspace, this.request.url);

        const body = await fsp.readFile(jsPath, 'utf-8');
        resolve({
          body,
          contentType: this.contentType,
          extension: this.extensions
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}

module.exports = JSTransform;