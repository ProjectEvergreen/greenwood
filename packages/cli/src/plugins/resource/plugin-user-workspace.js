/*
 * 
 * Detects and fully resolve requests to the user's workspace.  
 * This sets the default value for requests in Greenwood.
 *
 */
import { resolveForRelativeUrl } from '../../lib/resource-utils.js';
import { ResourceInterface } from '../../lib/resource-interface.js';

class UserWorkspaceResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
  }

  async shouldResolve(url) {
    const { userWorkspace } = this.compilation.context;
    const extension = url.pathname.split('.').pop();
    const hasExtension = extension !== '' && !extension.startsWith('/');

    return hasExtension
      && !url.pathname.startsWith('/node_modules')
      && await resolveForRelativeUrl(url, userWorkspace);
  }

  async resolve(url) {
    const { userWorkspace } = this.compilation.context;
    const workspaceUrl = await resolveForRelativeUrl(url, userWorkspace);

    return new Request(workspaceUrl);
  }
}

const greenwoodPluginUserWorkspace = {
  type: 'resource',
  name: 'plugin-user-workspace',
  provider: (compilation, options) => new UserWorkspaceResource(compilation, options)
};

export { greenwoodPluginUserWorkspace };