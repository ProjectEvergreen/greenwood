/*
 * 
 * Detects and fully resolve requests to source map (.map) files.
 *
 */
import fs from 'fs';
import path from 'path';
import { ResourceInterface } from '../../lib/resource-interface.js';

class SourceMapsResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['.map'];
  }

  async shouldServe(url) {
    return Promise.resolve(path.extname(url) === this.extensions[0] && fs.existsSync(url));
  }

  async serve(url) {
    return new Promise(async (resolve, reject) => {
      try {
        const sourceMap = fs.readFileSync(url, 'utf-8');
        
        resolve({
          body: sourceMap,
          contentType: 'application/json'
        });
      } catch (e) {
        reject(e);
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