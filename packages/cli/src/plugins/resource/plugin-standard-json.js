/*
 * 
 * Manages web standard resource related operations for JavaScript.
 * This is a Greenwood default plugin.
 *
 */
const fs = require('fs');
const json = require('@rollup/plugin-json');
const { ResourceInterface } = require('../../lib/resource-interface');

class StandardJsonResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['.json'];
    this.contentType = 'application/json';
  }

  async serve(url, headers) {
    return new Promise(async (resolve, reject) => {
      try {
        console.debug('url', url);
        const { scratchDir } = this.compilation.context;
        const filePath = url.indexOf('graph.json') >= 0
          ? `${scratchDir}/graph.json`
          : url;
        const { originalUrl } = headers.request;
        const contents = await fs.promises.readFile(filePath, 'utf-8');
        const isJsonInJs = originalUrl && originalUrl.indexOf('?type=json') >= 0;
        let body;
        let contentType;

        if (isJsonInJs) {
          contentType = 'text/javascript';
          body = `export default ${contents}`;
        } else {
          body = JSON.parse(contents);
          contentType = this.contentType;
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