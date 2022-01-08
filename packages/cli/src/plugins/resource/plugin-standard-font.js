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

    // https://developer.mozilla.org/en-US/docs/Learn/CSS/Styling_text/Web_fonts
    this.extensions = ['.woff2', '.woff', '.ttf', '.eot'];
  }

  async serve(url) {
    return new Promise(async (resolve, reject) => {
      try {
        const ext = path.extname(url).replace('.', '');
        const contentType = ext === 'eot' ? 'application/vnd.ms-fontobject' : ext;
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

const pluginGreenwoodStandardFont = {
  type: 'resource',
  name: 'plugin-standard-font',
  provider: (compilation, options) => new StandardFontResource(compilation, options)
};

export { pluginGreenwoodStandardFont };