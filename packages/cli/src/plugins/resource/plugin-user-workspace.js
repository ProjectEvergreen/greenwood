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

  async shouldResolve(url) {
    const { userWorkspace } = this.compilation.context;
    const pathname = url.pathname;
    const isWorkspaceFile = pathname !== '/'
      && pathname.split('.').pop() !== ''
      && fs.existsSync(new URL(`.${pathname}`, userWorkspace).pathname);

    return !pathname.startsWith('/node_modules/') && isWorkspaceFile;
  }

  async resolve(url) {
    const { userWorkspace } = this.compilation.context;
    const workspaceUrl = new URL(`.${url.pathname}`, userWorkspace);

    return new Request(`file://${workspaceUrl.pathname}`);
  }
}

const greenwoodPluginUserWorkspace = {
  type: 'resource',
  name: 'plugin-user-workspace',
  provider: (compilation, options) => new UserWorkspaceResource(compilation, options)
};

export { greenwoodPluginUserWorkspace };