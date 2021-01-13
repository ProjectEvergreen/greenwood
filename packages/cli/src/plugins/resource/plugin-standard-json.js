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

  async resolve(request) {
    return new Promise(async (resolve, reject) => {
      try {
        // TODO This is here because of ordering, should make JS / JSON matching less greedy
        // handle things outside if workspace, like a root directory resolver plugin?
        // console.debug('JSON file request!', ctx.url);'
        let body = '', contentType = '';
        const { context } = this.compilation;
        const { url } = request;

        if (url.indexOf('graph.json') >= 0) {
          const json = await fs.promises.readFile(path.join(context.scratchDir, 'graph.json'), 'utf-8');

          contentType = 'application/json';
          body = JSON.parse(json);
        } else {
          const json = await fs.promises.readFile(path.join(context.userWorkspace, url), 'utf-8');

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

module.exports = {
  type: 'resource',
  name: 'plugin-standard-json',
  provider: (compilation, options) => new StandardJsonResource(compilation, options)
};