/*
 * 
 * Detects and fully resolve requests to the user's workspace.  
 * This sets the default value for requests in Greenwood.
 *
 */
import { ResourceInterface } from '../../lib/resource-interface.js';

class UserWorkspaceResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['*'];
  }

  async shouldResolve(url) {
    const { userWorkspace } = this.compilation.context;

    return this.hasExtension(url)
      && !url.pathname.startsWith('/node_modules')
      && await this.resolveForRelativeUrl(url, userWorkspace);
  }

  async resolve(url) {
    const { userWorkspace } = this.compilation.context;
    const workspaceUrl = await this.resolveForRelativeUrl(url, userWorkspace);

    return new Request(workspaceUrl);
  }
}

const greenwoodPluginUserWorkspace = {
  type: 'resource',
  name: 'plugin-user-workspace',
  provider: (compilation, options) => new UserWorkspaceResource(compilation, options)
};

export { greenwoodPluginUserWorkspace };