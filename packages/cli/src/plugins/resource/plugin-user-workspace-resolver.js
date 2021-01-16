/*
 * 
 * Detects and fully resolve requests to the user's workspace.  
 * This sets the default value for requests in Greenwood.
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
    return new Promise(async (resolve, reject) => {
      try {
        const workspaceUrl = path.join(this.compilation.context.userWorkspace, url);
        
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