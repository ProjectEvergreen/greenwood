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

    // if url is immediately resolvable to a file path, we should return early
    // else try and expand and map as a relative path
    if (isAbsoluteWorkspaceFile) {
      return Promise.resolve(isAbsoluteWorkspaceFile || bareUrl === '/');
    } else if (url.indexOf('node_modules') < 0 && path.extname(url) !== '') {
      const reducedUrl = this.getReducedUrl(userWorkspace, bareUrl);

      return Promise.resolve(reducedUrl);
    }
  }

  async resolve(url = '/') {
    const { userWorkspace } = this.compilation.context;

    return new Promise(async (resolve, reject) => {
      try {
        const bareUrl = this.getBareUrlPath(url);
        const workspaceUrl = fs.existsSync(path.join(userWorkspace, bareUrl))
          ? path.join(userWorkspace, bareUrl)
          : path.join(userWorkspace, this.getReducedUrl(userWorkspace, bareUrl));
        
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