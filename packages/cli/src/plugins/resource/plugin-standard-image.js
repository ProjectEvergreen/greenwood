/*
 * 
 * Manages web standard resource related operations for JavaScript.
 * This is a Greenwood default plugin.
 *
 */
import fs from 'fs';
import { ResourceInterface } from '../../lib/resource-interface.js';

class StandardFontResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);

    // https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types
    this.extensions = ['avif', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'ico'];
  }

  async shouldServe(url) {
    return url.protocol === 'file:' && this.extensions.indexOf(url.pathname.split('.').pop()) >= 0;
  }

  async serve(url) {
    const extension = url.pathname.split('.').pop();
    const type = extension === 'svg' ? `${extension}+xml` : extension;
    const exts = [...this.extensions];
    const isIco = extension === 'ico';
    let body = '';
    let contentType = '';

    if (exts.includes(extension)) {
      contentType = `image/${type}`;

      if (extension === 'svg') {
        body = await fs.promises.readFile(url, 'utf-8');
      } else {
        // TODO this doesn't seem to work
        body = await fs.promises.readFile(url); 
      }
    } else if (isIco) {
      contentType = 'image/x-icon';
      body = await fs.promises.readFile(url);
    }

    // TODO avoid having to rebuild response each time?
    return new Response(body, {
      headers: {
        'content-type': contentType
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