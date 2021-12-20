/*
 * 
 * Detects and fully resolve requests to the user's workspace.  
 * This sets the default value for requests in Greenwood.
 *
 */
import fs from 'fs';
import path from 'path';
import { ResourceInterface } from '../../lib/resource-interface.js';

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
      : url.indexOf('node_modules') < 0 && this.resolveRelativeUrl(userWorkspace, bareUrl);

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

const greenwoodPluginUserWorkspace = {
  type: 'resource',
  name: 'plugin-user-workspace',
  provider: (compilation, options) => new UserWorkspaceResource(compilation, options)
};

export { greenwoodPluginUserWorkspace };