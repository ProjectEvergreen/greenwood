/*
 * 
 * Manages requests to node_modules.
 *
 */
const path = require('path');
const { ResourceInterface } = require('../../lib/resource-interface');

class UserWorkspaceResolverResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['*'];
    this.contentType = '';
  }

  async resolve(url) {
    console.debug('user workspace resolver: resolve all paths to userWorkspace => ', url);
    return new Promise(async (resolve, reject) => {
      try {
        const workspaceUrl = path.join(this.compilation.context.userWorkspace, url);
        
        console.debug('final workspaceUrl => ', workspaceUrl);

        resolve(workspaceUrl);
      } catch (e) {
        reject(e);
      }
    });
  }
}

module.exports = {
  type: 'resource',
  name: 'plugin-user-workspace-resolver',
  provider: (compilation, options) => new UserWorkspaceResolverResource(compilation, options)
};