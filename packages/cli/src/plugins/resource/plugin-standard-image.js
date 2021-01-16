/*
 * 
 * Manages web standard resource related operations for JavaScript.
 * This is a Greenwood default plugin.
 *
 */
const fs = require('fs');
const path = require('path');
const { ResourceInterface } = require('../../lib/resource-interface');

class StandardFontResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['.jpg', '.png', '.gif', '.svg', '.ico'];
  }

  async serve(url) {
    return new Promise(async (resolve, reject) => {
      try {
        let body = '';
        let contentType = '';
        const ext = path.extname(url);
        const type = ext === '.svg'
          ? `${ext.replace('.', '')}+xml`
          : ext.replace('.', '');

        if (['.jpg', '.png', '.gif', '.svg'].includes(ext)) {
          contentType = `image/${type}`;

          if (ext === '.svg') {
            body = await fs.promises.readFile(url, 'utf-8');
          } else {
            body = await fs.promises.readFile(url); 
          }
        } else if (['.ico'].includes(ext)) {
          contentType = 'image/x-icon';
          body = await fs.promises.readFile(assetPath);
        }

        resolve({
          body,
          contentType
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}

module.exports = {
  type: 'resource',
  name: 'plugin-standard-font',
  provider: (compilation, options) => new StandardFontResource(compilation, options)
};