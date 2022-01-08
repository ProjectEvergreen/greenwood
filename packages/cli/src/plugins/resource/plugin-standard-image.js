/*
 * 
 * Manages web standard resource related operations for JavaScript.
 * This is a Greenwood default plugin.
 *
 */
import fs from 'fs';
import path from 'path';
import { ResourceInterface } from '../../lib/resource-interface.js';

class StandardFontResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);

    // https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types
    this.extensions = ['.avif', '.webp', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico'];
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

        if (['.avif', '.webp', '.jpg', '.jpeg', '.png', '.gif', '.svg'].includes(ext)) {
          contentType = `image/${type}`;

          if (ext === '.svg') {
            body = await fs.promises.readFile(url, 'utf-8');
          } else {
            body = await fs.promises.readFile(url); 
          }
        } else if (['.ico'].includes(ext)) {
          contentType = 'image/x-icon';
          body = await fs.promises.readFile(url);
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

const greenwoodPluginStandardImage = {
  type: 'resource',
  name: 'plugin-standard-font',
  provider: (compilation, options) => new StandardFontResource(compilation, options)
};

export { greenwoodPluginStandardImage };