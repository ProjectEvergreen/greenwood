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
    this.extensions = ['.woff2', '.woff', '.ttf'];
  }

  async serve(url) {
    return new Promise(async (resolve, reject) => {
      try {
        const contentType = path.extname(url).replace('.', '');
        const body = await fs.promises.readFile(url);

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