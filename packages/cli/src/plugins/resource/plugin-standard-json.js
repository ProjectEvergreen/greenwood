/*
 * 
 * Manages web standard resource related operations for JavaScript.
 * This is a Greenwood default plugin.
 *
 */
const fs = require('fs');
const path = require('path');
const { ResourceInterface } = require('../../lib/resource-interface');

class StandardJsonResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['.json'];
    this.contentType = 'application/json';
  }

  async shouldServe(url = '') {
    return Promise.resolve(path.extname(url) === '.json');
  }

  async serve(url) {
    return new Promise(async (resolve, reject) => {
      try {
        const { scratchDir } = this.compilation.context; 
        const filePath = path.basename(url) === 'graph.json'
          ? path.join(scratchDir, 'graph.json')
          : url;
        const json = await fs.promises.readFile(filePath, 'utf-8');

        resolve({
          body: JSON.parse(json),
          contentType: this.contentType
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}

module.exports = [{
  type: 'resource',
  name: 'plugin-standard-json:resource',
  provider: (compilation, options) => new StandardJsonResource(compilation, options)
}];