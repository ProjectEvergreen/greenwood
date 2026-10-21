/*
 *
 * Detects and fully resolve requests to the user's workspace.
 * This sets the default value for requests in Greenwood.
 *
 */
import { resolveForRelativeUrl } from "../../lib/resource-utils.js";
import { isPackageResourcePath } from "../../lib/package-resolution.js";

class UserWorkspaceResource {
  constructor(compilation) {
    this.compilation = compilation;
  }

  async shouldResolve(url) {
    const { userWorkspace } = this.compilation.context;
    const { pathname } = url;
    const extension = pathname.split(".").pop();
    const hasExtension = extension !== "" && !extension.startsWith("/");

    return (
      hasExtension &&
      !isPackageResourcePath(pathname) &&
      (await resolveForRelativeUrl(url, userWorkspace))
    );
  }

  async resolve(url) {
    const { userWorkspace } = this.compilation.context;
    const workspaceUrl = await resolveForRelativeUrl(url, userWorkspace);

    return new Request(workspaceUrl);
  }
}

const greenwoodPluginUserWorkspace = {
  type: "resource",
  name: "plugin-user-workspace",
  provider: (compilation) => new UserWorkspaceResource(compilation),
};

export { greenwoodPluginUserWorkspace };
