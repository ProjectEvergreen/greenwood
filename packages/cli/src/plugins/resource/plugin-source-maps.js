/*
 * 
 * Detects and fully resolve requests to source map (.map) files.
 *
 */
import fs from 'fs';
import { ResourceInterface } from '../../lib/resource-interface.js';

class SourceMapsResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['.map'];
  }

  async shouldServe(url) {
    return `.${url.pathname.split('.').pop()}` === this.extensions[0] && fs.existsSync(url.pathname);
  }

  async serve(url) {
    const body = await fs.promises.readFile(url, 'utf-8');

    return new Response(body, {
      headers: {
        'Content-Type': 'text/javascript'
      }
    });
  }
}

const greenwoodPluginSourceMaps = {
  type: 'resource',
  name: 'plugin-source-maps',
  provider: (compilation, options) => new SourceMapsResource(compilation, options)
};

export { greenwoodPluginSourceMaps };