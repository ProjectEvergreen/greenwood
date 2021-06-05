/*
 * 
 * Detects and fully resolve requests to the user's workspace.  
 * This sets the default value for requests in Greenwood.
 *
 */
const fs = require('fs');
const path = require('path');
const { ResourceInterface } = require('../../lib/resource-interface');

class UserWorkspaceResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['*'];
  }

  async shouldResolve(url = '/') {
    const { userWorkspace } = this.compilation.context;
    const bareUrl = this.getBareUrlPath(url);
    const isAbsoluteWorkspaceFile = fs.existsSync(path.join(userWorkspace, bareUrl));
    const workspaceUrl = isAbsoluteWorkspaceFile
      ? isAbsoluteWorkspaceFile || bareUrl === '/'
      : this.resolveRelativeUrl(userWorkspace, bareUrl);

    return Promise.resolve(workspaceUrl);
  }

  async resolve(url = '/') {
    const { userWorkspace } = this.compilation.context;

    return new Promise(async (resolve, reject) => {
      try {
        const bareUrl = this.getBareUrlPath(url);
        const workspaceUrl = fs.existsSync(path.join(userWorkspace, bareUrl))
          ? path.join(userWorkspace, bareUrl)
          : path.join(userWorkspace, this.resolveRelativeUrl(userWorkspace, bareUrl));
        
        resolve(workspaceUrl);
      } catch (e) {
        reject(e);
      }
    });
  }
}

module.exports = {
  type: 'resource',
  name: 'plugin-user-workspace',
  provider: (compilation, options) => new UserWorkspaceResource(compilation, options)
};