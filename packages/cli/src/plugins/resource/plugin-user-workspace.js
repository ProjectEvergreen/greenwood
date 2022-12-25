/*
 * 
 * Detects and fully resolve requests to the user's workspace.  
 * This sets the default value for requests in Greenwood.
 *
 */
import fs from 'fs';
import { ResourceInterface } from '../../lib/resource-interface.js';

class UserWorkspaceResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['*'];
  }

  async shouldResolve(request) {
    const url = new URL(request.url);
    const { userWorkspace } = this.compilation.context;
    const barePath = url.pathname;
    const isWorkspaceFile = barePath !== '/'
      && barePath.split('.').pop() !== ''
      && fs.existsSync(new URL(`.${barePath}`, userWorkspace).pathname);

    return barePath.indexOf('node_modules') < 0 && isWorkspaceFile;
  }

  async resolve(request) {
    const { userWorkspace } = this.compilation.context;
    const url = new URL(request.url);
    const barePath = url.pathname;
    const workspaceUrl = new URL(`.${barePath}`, userWorkspace);

    return new Request(`file://${workspaceUrl.pathname}`);
  }
}

const greenwoodPluginUserWorkspace = {
  type: 'resource',
  name: 'plugin-user-workspace',
  provider: (compilation, options) => new UserWorkspaceResource(compilation, options)
};

export { greenwoodPluginUserWorkspace };