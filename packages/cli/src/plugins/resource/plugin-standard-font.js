/*
 * 
 * Manages web standard resource related operations for JavaScript.
 * This is a Greenwood default plugin.
 *
 */
import fs from 'fs/promises';
import { ResourceInterface } from '../../lib/resource-interface.js';

class StandardFontResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);

    // https://developer.mozilla.org/en-US/docs/Learn/CSS/Styling_text/Web_fonts
    this.extensions = ['woff2', 'woff', 'ttf', 'eot'];
  }

  async shouldServe(url) {
    return this.extensions.indexOf(url.pathname.split('.').pop()) >= 0;
  }

  async serve(url) {
    const extension = url.pathname.split('.').pop();
    const contentType = extension === 'eot' ? 'application/vnd.ms-fontobject' : extension;
    const body = await fs.readFile(url);

    return new Response(body, {
      headers: new Headers({
        'Content-Type': contentType
      })
    });
  }
}

const pluginGreenwoodStandardFont = {
  type: 'resource',
  name: 'plugin-standard-font',
  provider: (compilation, options) => new StandardFontResource(compilation, options)
};

export { pluginGreenwoodStandardFont };