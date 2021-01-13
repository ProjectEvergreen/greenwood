/*
 * 
 * Manages web standard resource related operations for JavaScript.
 * This is a Greenwood default plugin.
 *
 */
const fs = require('fs');
const path = require('path');
const { ResourceInterface } = require('../../lib/resource-interface');

class StandardJavaScriptResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['.js'];
    this.contentType = 'text/javascript';
  }

  async resolve(request) {
    return new Promise(async(resolve, reject) => {
      try {
        const { url } = request;
        const jsPath = url.indexOf('/node_modules') >= 0
          ? path.join(process.cwd(), url)
          : path.join(this.compilation.context.userWorkspace, url);
        const body = await fs.promises.readFile(jsPath, 'utf-8');
    
        resolve({
          body,
          contentType: this.contentType
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}

module.exports = {
  type: 'resource',
  name: 'plugin-standard-javascript',
  provider: (compilation, options) => new StandardJavaScriptResource(compilation, options)
};