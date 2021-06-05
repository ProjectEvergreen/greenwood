/*
 * 
 * Manages web standard resource related operations for JavaScript.
 * This is a Greenwood default plugin.
 *
 */
const fs = require('fs');
const { ResourceInterface } = require('../../lib/resource-interface');

class StandardJsonResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['.json'];
    this.contentType = 'application/json';
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

module.exports = [{
  type: 'resource',
  name: 'plugin-standard-json:resource',
  provider: (compilation, options) => new StandardJsonResource(compilation, options)
}];