const path = require('path');
const { promises: fsp } = require('fs');
const TransformInterface = require('./transform.interface');

class TransformJSON extends TransformInterface {

  constructor(req) {
    super(req, ['.json']);
  }

  async applyTransform() {
    return new Promise(async (resolve, reject) => {
      try {

        // TODO This is here because of ordering, should make JS / JSON matching less greedy
        // handle things outside if workspace, like a root directory resolver plugin?
        // console.debug('JSON file request!', ctx.url);'
        let body = '', contentType = '';
        const { url } = this.request;

        if (url.indexOf('graph.json') >= 0) {
          const json = await fsp.readFile(path.join(this.scratchDir, 'graph.json'), 'utf-8');

          contentType = 'application/json';
          body = JSON.parse(json);
        } else {
          const json = await fsp.readFile(path.join(this.workspace, url), 'utf-8');

          contentType = 'text/javascript';
          body = `export default ${json}`;
        }

        resolve({
          body,
          contentType,
          extension: this.extensions
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}

module.exports = TransformJSON;