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
    this.contentType = 'text/javascript';
  }

  async serve(url) {
    return new Promise(async (resolve, reject) => {
      try {
        let body = ''; 
        let contentType = '';
        const { context } = this.compilation;

        // TODO should be its own plugin / package, as part of data
        if (url.indexOf('graph.json') >= 0) {
          const json = await fs.promises.readFile(path.join(context.scratchDir, 'graph.json'), 'utf-8');

          contentType = 'application/json';
          body = JSON.parse(json);
        } else {
          // TODO should be its own plugin / package
          const json = await fs.promises.readFile(url, 'utf-8');

          contentType = 'text/javascript';
          body = `export default ${json}`;
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

  // TODO include rollup json plugin support
}

module.exports = {
  type: 'resource',
  name: 'plugin-standard-json',
  provider: (compilation, options) => new StandardJsonResource(compilation, options)
};