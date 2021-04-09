/*
 * 
 * Manages web standard resource related operations for JavaScript.
 * This is a Greenwood default plugin.
 *
 */
const fs = require('fs');
const json = require('@rollup/plugin-json');
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

        if (url.indexOf('graph.json') >= 0) {
          const json = await fs.promises.readFile(path.join(context.scratchDir, 'graph.json'), 'utf-8');

          contentType = 'application/json';
          body = JSON.parse(json);
        } else {
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
}

module.exports = [{
  type: 'resource',
  name: 'plugin-standard-json:resource',
  provider: (compilation, options) => new StandardJsonResource(compilation, options)
}, {
  type: 'resource',
  name: 'plugin-standard-json:rollup',
  provider: () => {
    return [
      json()
    ];
  }
}];