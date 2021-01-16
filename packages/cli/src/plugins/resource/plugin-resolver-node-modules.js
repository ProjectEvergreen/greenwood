/*
 * 
 * Detects and fully resolve srequest to node_modules.
 *
 */
const path = require('path');
const { ResourceInterface } = require('../../lib/resource-interface');

class NodeModulesResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['*'];
  }

  shouldResolve(url) {
    return url.indexOf('node_modules/') >= 0;
  }

  async resolve(url) {
    return new Promise((resolve, reject) => {
      try {
        const relativeUrl = url.replace(this.compilation.context.userWorkspace, '');
        const nodeModulesUrl = path.join(process.cwd(), relativeUrl);
        
        resolve(nodeModulesUrl);
      } catch (e) {
        console.error(e);
        reject(e);
      }
    });
  }
}

module.exports = {
  type: 'resource',
  name: 'plugin-node-modules-resolver',
  provider: (compilation, options) => new NodeModulesResource(compilation, options)
};