/*
 * 
 * Detects and fully resolves requests to node_modules and handles creating an importMap.
 *
 */
import { checkResourceExists } from '../../lib/resource-utils.js';
import fs from 'fs/promises';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import { getNodeModulesLocationForPackage, getPackageJson, getPackageNameFromUrl } from '../../lib/node-modules-utils.js';
import { resolveForRelativeUrl } from '../../lib/resource-utils.js';
import { ResourceInterface } from '../../lib/resource-interface.js';
import { walkPackageJson } from '../../lib/walker-package-ranger.js';

let importMap;

class NodeModulesResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['js', 'mjs'];
    this.contentType = 'text/javascript';
  }

  async shouldResolve(url) {
    return url.pathname.indexOf('/node_modules/') === 0;
  }

  // TODO convert node modules util to URL
  async resolve(url) {
    const { projectDirectory } = this.compilation.context;
    const { pathname } = url;
    const packageName = getPackageNameFromUrl(pathname);
    const absoluteNodeModulesLocation = await getNodeModulesLocationForPackage(packageName);
    const packagePathPieces = pathname.split('node_modules/')[1].split('/'); // double split to handle node_modules within nested paths
    // use node modules resolution logic first, else hope for the best from the root of the project
    const absoluteNodeModulesPathname = absoluteNodeModulesLocation
      ? `${absoluteNodeModulesLocation}${packagePathPieces.join('/').replace(packageName, '')}`
      : (await resolveForRelativeUrl(url, projectDirectory)).pathname;

    return new Request(`file://${absoluteNodeModulesPathname}`);
  }

  async shouldServe(url) {
    const { href, pathname, protocol } = url;
    const extension = pathname.split('.').pop();
    const existsAsJs = protocol === 'file:' && await checkResourceExists(new URL(`${href}.js`));

    return extension === 'mjs'
      || extension === '' && existsAsJs
      || extension === 'js' && url.pathname.startsWith('/node_modules/');
  }

  async serve(url) {
    const pathname = url.pathname;
    const urlExtended = pathname.split('.').pop() === ''
      ? new URL(`file://${pathname}.js`)
      : url;
    const body = await fs.readFile(urlExtended, 'utf-8');

    return new Response(body, {
      headers: new Headers({
        'Content-Type': this.contentType
      })
    });
  }

  async shouldIntercept(url, request, response) {
    return response.headers.get('Content-Type').indexOf('text/html') >= 0;
  }

  async intercept(url, request, response) {
    const { context } = this.compilation;
    let body = await response.text();
    const hasHead = body.match(/\<head>(.*)<\/head>/s);

    if (hasHead && hasHead.length > 0) {
      const contents = hasHead[0].replace(/type="module"/g, 'type="module-shim"');

      body = body.replace(/\<head>(.*)<\/head>/s, contents.replace(/\$/g, '$$$')); // https://github.com/ProjectEvergreen/greenwood/issues/656);
    }

    const userPackageJson = await getPackageJson(context);
    
    // if there are dependencies and we haven't generated the importMap already
    // walk the project's package.json for all its direct dependencies
    // for each entry found in dependencies, find its entry point
    // then walk its entry point (e.g. index.js) for imports / exports to add to the importMap
    // and then walk its package.json for transitive dependencies and all those import / exports
    importMap = !importMap && Object.keys(userPackageJson.dependencies || []).length > 0
      ? await walkPackageJson(userPackageJson)
      : importMap || {};

    // apply import map and shim for users
    body = body.replace('<head>', `
      <head>
        <script defer src="/node_modules/es-module-shims/dist/es-module-shims.js"></script>
        <script type="importmap-shim">
          {
            "imports": ${JSON.stringify(importMap, null, 1)}
          }
        </script>
    `);

    return new Response(body);
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