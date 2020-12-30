const path = require('path');
const { promises: fsp } = require('fs');
const TransformInterface = require('./transform.interface');

class FontTransform extends TransformInterface {

  constructor(req, compilation) {
    super(req, compilation, {
      extensions: ['.woff2', '.woff', '.ttf']
    });
  }

  shouldTransform() {
    const { url } = this.request;

    return url.indexOf('assets/') >= 0 && url.indexOf('.css') < 0;
  }

  async applyTransform() {
    return new Promise(async (resolve, reject) => {
      try {

        let body = '', contentType = '';
        const assetPath = path.join(this.workspace, this.request.url);
        const ext = path.extname(assetPath);
        const type = ext.replace('.', '');

        if (['.woff2', '.woff', '.ttf'].includes(ext)) {
          contentType = `font/${type}`;
          body = await fsp.readFile(assetPath);
        } else {
          contentType = `text/${type}`;
          body = await fsp.readFile(assetPath, 'utf-8');
        }

        resolve({
          body,
          contentType,
          extension: this.extensions
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}

module.exports = FontTransform;