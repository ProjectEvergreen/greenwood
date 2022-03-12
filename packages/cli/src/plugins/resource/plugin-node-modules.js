/*
 * 
 * Detects and fully resolves requests to node_modules and handles creating an importMap.
 *
 */
import fs from 'fs';
import path from 'path';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import { getNodeModulesLocationForPackage, getPackageNameFromUrl } from '../../lib/node-modules-utils.js';
import { ResourceInterface } from '../../lib/resource-interface.js';
import { walkPackageJson } from '../../lib/walker-package-ranger.js';

let importMap;

class NodeModulesResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['*'];
  }

  async shouldResolve(url) {
    return Promise.resolve(url.indexOf('node_modules/') >= 0);
  }

  async resolve(url) {
    const bareUrl = this.getBareUrlPath(url);
    const { projectDirectory } = this.compilation.context;
    const packageName = getPackageNameFromUrl(bareUrl);
    const absoluteNodeModulesLocation = await getNodeModulesLocationForPackage(packageName);
    const packagePathPieces = bareUrl.split('node_modules/')[1].split('/'); // double split to handle node_modules within nested paths
    let absoluteNodeModulesUrl;

    if (absoluteNodeModulesLocation) {
      absoluteNodeModulesUrl = `${absoluteNodeModulesLocation}${packagePathPieces.join('/').replace(packageName, '')}`;
    } else {
      const isAbsoluteNodeModulesFile = fs.existsSync(path.join(projectDirectory, bareUrl));
      
      absoluteNodeModulesUrl = isAbsoluteNodeModulesFile
        ? path.join(projectDirectory, bareUrl)
        : this.resolveRelativeUrl(projectDirectory, bareUrl)
          ? path.join(projectDirectory, this.resolveRelativeUrl(projectDirectory, bareUrl))
          : bareUrl;
    }

    return Promise.resolve(absoluteNodeModulesUrl);
  }

  async shouldServe(url) {
    return Promise.resolve(path.extname(url) === '.mjs' 
      || (path.extname(url) === '' && fs.existsSync(`${url}.js`))
      || (path.extname(url) === '.js' && (/node_modules/).test(url)));
  }

  async serve(url) {
    return new Promise(async(resolve, reject) => {
      try {
        const fullUrl = path.extname(url) === ''
          ? `${url}.js`
          : url;
        const body = await fs.promises.readFile(fullUrl, 'utf-8');

        resolve({
          body,
          contentType: 'text/javascript'
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  async shouldIntercept(url, body, headers) {
    return Promise.resolve(headers.response['content-type'] === 'text/html');
  }

  async intercept(url, body) {
    return new Promise(async (resolve, reject) => {
      try {
        const { userWorkspace } = this.compilation.context;
        let newContents = body;
        const hasHead = body.match(/\<head>(.*)<\/head>/s);

        if (hasHead && hasHead.length > 0) {
          const contents = hasHead[0]
            .replace(/type="module"/g, 'type="module-shim"');

          newContents = newContents.replace(/\<head>(.*)<\/head>/s, contents.replace(/\$/g, '$$$')); // https://github.com/ProjectEvergreen/greenwood/issues/656);
        }

        const userPackageJson = fs.existsSync(`${userWorkspace}/package.json`)
          ? JSON.parse(fs.readFileSync(path.join(userWorkspace, 'package.json'), 'utf-8')) // its a monorepo?
          : fs.existsSync(`${process.cwd()}/package.json`)
            ? JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'))
            : {};
        
        // if there are dependencies and we haven't generated the importMap already
        // walk the project's package.json for all its direct dependencies
        // for each entry found in dependencies, find its entry point
        // then walk its entry point (e.g. index.js) for imports / exports to add to the importMap
        // and then walk its package.json for transitive dependencies and all those import / exports
        importMap = !importMap && Object.keys(userPackageJson.dependencies || []).length > 0
          ? await walkPackageJson(userPackageJson)
          : importMap || {};

        // apply import map and shim for users
        newContents = newContents.replace('<head>', `
          <head>
            <script defer src="/node_modules/es-module-shims/dist/es-module-shims.js"></script>
            <script type="importmap-shim">
              {
                "imports": ${JSON.stringify(importMap, null, 1)}
              }
            </script>
        `);

        resolve({
          body: newContents
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}

const greenwoodPluginNodeModules = [{
  type: 'resource',
  name: 'plugin-node-modules:resource',
  provider: (compilation, options) => new NodeModulesResource(compilation, options)
}, {
  type: 'rollup',
  name: 'plugin-node-modules:rollup',
  provider: () => {
    return [
      replace({
        // https://github.com/ProjectEvergreen/greenwood/issues/582
        'preventAssignment': true,
        
        // https://github.com/rollup/rollup/issues/487#issuecomment-177596512
        'process.env.NODE_ENV': JSON.stringify('production')
      }),
      nodeResolve()
    ];
  }
}];

export { greenwoodPluginNodeModules };