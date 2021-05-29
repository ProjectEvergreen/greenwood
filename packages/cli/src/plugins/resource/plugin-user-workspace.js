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

  getBareUrlPath(url) {
    // get rid of things like query string parameters
    return url.replace(/\?(.*)/, '');
  }

  getReducedUrl(url) {
    const { userWorkspace } = this.compilation.context;
    let reducedUrl;
    console.debug('url', url);

    url.split('/')
      .filter(piece => piece !== '')
      .reduce((acc, piece) => {
        console.debug('piece', piece);
        console.debug('acc', acc);
        // fs.existsSync(path.join(userWorkspace, bareUrl));
        const reducedPath = url.replace(`${acc}/${piece}`, '');
        console.debug('reducedPath', reducedPath);
        if (path.extname(reducedPath) !== '' && fs.existsSync(path.join(userWorkspace, reducedPath))) {
          console.debug('WOW, GREAT SUCCESS!!!!');
          reducedUrl = reducedPath;
        }
        return `${acc}/${piece}`;
      }, '');

    console.debug('reducedUrl', reducedUrl);
    console.debug('*****************************************************************');
    return reducedUrl;
  }

  async shouldResolve(url = '/') {
    const { userWorkspace } = this.compilation.context;
    const bareUrl = this.getBareUrlPath(url);
    const isAbsoluteWorkspaceFile = fs.existsSync(path.join(userWorkspace, bareUrl));

    // if url is immediately resolvable to a file path, we should return early
    if (isAbsoluteWorkspaceFile) {
      return Promise.resolve(isAbsoluteWorkspaceFile || bareUrl === '/');
    } else if (url.indexOf('node_modules') < 0 && path.extname(url) !== '') {
      // /one/two/styles/theme.css -> /../../styles/theme.css
      console.debug('how to handle relative URL????', url);
      let reducedUrl = this.getReducedUrl(bareUrl);

      console.debug('!!!!!! reducedUrl', reducedUrl);
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
          : path.join(userWorkspace, this.getReducedUrl(bareUrl));
        
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