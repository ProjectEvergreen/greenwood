/*
 * 
 * Manages web standard resource related operations for JavaScript.
 * This is a Greenwood default plugin.
 *
 */
import fs from 'fs';
import path from 'path';
import { ResourceInterface } from '../../lib/resource-interface.js';

class StandardJsonResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['.json'];
    this.contentType = 'application/json';
  }

  async shouldServe(url) {
    return Promise.resolve(
      url.indexOf('graph.json') >= 0 ||
      path.extname(url) === '.json' && fs.existsSync(url)
    );
  }

  async serve(url) {
    return new Promise(async (resolve, reject) => {
      try {
        const { scratchDir } = this.compilation.context;
        const filePath = url.indexOf('graph.json') >= 0
          ? `${scratchDir}/graph.json`
          : url;
        const contents = await fs.promises.readFile(filePath, 'utf-8');

        resolve({
          body: JSON.parse(contents),
          contentType: this.contentType
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}

const pluginGreenwoodStandardJson = [{
  type: 'resource',
  name: 'plugin-standard-json:resource',
  provider: (compilation, options) => new StandardJsonResource(compilation, options)
}];

export { pluginGreenwoodStandardJson };