/*
 * 
 * Detects and fully resolve requests to source map (.map) files.
 *
 */
import fs from 'fs/promises';
import { ResourceInterface } from '../../lib/resource-interface.js';

class SourceMapsResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['map'];
    this.contentType = 'application/json';
  }

  async shouldServe(url) {
    try {
      if (url.pathname.split('.').pop() === this.extensions[0]) {
        await fs.access(url);
        return true;
      }
    } catch (e) {

    }
  }

  async serve(url) {
    const body = await fs.readFile(url, 'utf-8');

    return new Response(body, {
      headers: new Headers({
        'Content-Type': this.contentType
      })
    });
  }
}

const greenwoodPluginSourceMaps = {
  type: 'resource',
  name: 'plugin-source-maps',
  provider: (compilation, options) => new SourceMapsResource(compilation, options)
};

export { greenwoodPluginSourceMaps };