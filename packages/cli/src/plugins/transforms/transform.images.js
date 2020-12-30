const path = require('path');
const { promises: fsp } = require('fs');
const TransformInterface = require('./transform.interface');

class ImageTransform extends TransformInterface {

  constructor(req, compilation) {
    super(req, compilation, {
      extensions: ['.ico', '.jpg', '.png', '.gif', '.svg']
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
        const type = ext === '.svg'
          ? `${ext.replace('.', '')}+xml`
          : ext.replace('.', '');

        if (['.jpg', '.png', '.gif', '.svg'].includes(ext)) {
          contentType = `image/${type}`;

          if (ext === '.svg') {
            body = await fsp.readFile(assetPath, 'utf-8');
          } else {
            body = await fsp.readFile(assetPath); 
          }
        } else if (['.ico'].includes(ext)) {
          contentType = 'image/x-icon';
          body = await fsp.readFile(assetPath);
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

module.exports = ImageTransform;