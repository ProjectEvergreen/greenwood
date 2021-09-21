/*
 * 
 * Detects and fully resolves requests to node_modules and handles creating an importMap.
 *
 */
const acorn = require('acorn');
const fs = require('fs');
const path = require('path');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const replace = require('@rollup/plugin-replace');
const { getNodeModulesResolveLocationForPackageName, getFallbackNodeModulesLocation, getPackageNameFromUrl } = require('../../lib/node-modules-utils');
const { ResourceInterface } = require('../../lib/resource-interface');
const walk = require('acorn-walk');

const importMap = {};

const updateImportMap = (entry, entryPath) => {

  if (path.extname(entryPath) === '') {
    entryPath = `${entryPath}/${entry}.js`;
  }

  importMap[entry] = entryPath;
};

const getPackageEntryPath = (packageJson) => {
  let entry = packageJson.exports
    ? Object.keys(packageJson.exports) // first favor export maps first
    : packageJson.module // next favor ESM entry points
      ? packageJson.module
      : packageJson.main && packageJson.main !== '' // then favor main
        ? packageJson.main
        : 'index.js'; // lastly, fallback to index.js

  // use .mjs version if it exists, for packages like redux
  if (!Array.isArray(entry) && fs.existsSync(`${getNodeModulesResolveLocationForPackageName(packageJson.name)}/${entry.replace('.js', '.mjs')}`)) {
    entry = entry.replace('.js', '.mjs');
  }

  return entry;
};

const walkModule = (module, dependency) => {
  walk.simple(acorn.parse(module, {
    ecmaVersion: '2020',
    sourceType: 'module'
  }), {
    ImportDeclaration(node) {
      let { value: sourceValue } = node.source;
      const absoluteNodeModulesLocation = getNodeModulesResolveLocationForPackageName(dependency)
        ? getNodeModulesResolveLocationForPackageName(dependency)
        : getFallbackNodeModulesLocation(dependency);

      if (path.extname(sourceValue) === '' && sourceValue.indexOf('http') !== 0 && sourceValue.indexOf('./') < 0) {        
        if (!importMap[sourceValue]) {
          // found a _new_ bare import for ${sourceValue}
          // we should add this to the importMap and walk its package.json for more transitive deps
          updateImportMap(sourceValue, `/node_modules/${sourceValue}`);
        }
        
        walkPackageJson(path.join(absoluteNodeModulesLocation, 'package.json'));
      } else if (sourceValue.indexOf('./') < 0) {
        // adding a relative import
        updateImportMap(sourceValue, `/node_modules/${sourceValue}`);
      } else {
        // walk this module for all its dependencies
        sourceValue = sourceValue.indexOf('.js') < 0
          ? `${sourceValue}.js`
          : sourceValue;

        if (fs.existsSync(path.join(absoluteNodeModulesLocation, sourceValue))) {
          const moduleContents = fs.readFileSync(path.join(absoluteNodeModulesLocation, sourceValue));
          walkModule(moduleContents, dependency);
          updateImportMap(`${dependency}/${sourceValue.replace('./', '')}`, `/node_modules/${dependency}/${sourceValue.replace('./', '')}`);
        }
      }
    },
    ExportNamedDeclaration(node) {
      const sourceValue = node && node.source ? node.source.value : '';

      if (sourceValue !== '' && sourceValue.indexOf('.') !== 0 && sourceValue.indexOf('http') !== 0) {
        updateImportMap(sourceValue, `/node_modules/${sourceValue}`);
      }
    },
    ExportAllDeclaration(node) {
      const sourceValue = node && node.source ? node.source.value : '';

      if (sourceValue !== '' && sourceValue.indexOf('.') !== 0 && sourceValue.indexOf('http') !== 0) {
        updateImportMap(sourceValue, `/node_modules/${sourceValue}`);
      }
    }
  });
};

const walkPackageJson = (packageJson = {}) => {
  // while walking a package.json we need to find its entry point, e.g. index.js
  // and then walk that for import / export statements
  // and walk its package.json for its dependencies

  Object.keys(packageJson.dependencies || {}).forEach(dependency => {
    const dependencyPackageRootPath = path.join(process.cwd(), './node_modules', dependency);
    const dependencyPackageJsonPath = path.join(dependencyPackageRootPath, 'package.json');
    const dependencyPackageJson = require(dependencyPackageJsonPath);
    const entry = getPackageEntryPath(dependencyPackageJson);
    const isJavascriptPackage = Array.isArray(entry) || typeof entry === 'string' && entry.endsWith('.js') || entry.endsWith('.mjs');

    if (isJavascriptPackage) {
      const absoluteNodeModulesLocation = getNodeModulesResolveLocationForPackageName(dependency)
        ? getNodeModulesResolveLocationForPackageName(dependency)
        : getFallbackNodeModulesLocation(dependency);

      // https://nodejs.org/api/packages.html#packages_determining_module_system
      if (Array.isArray(entry)) {
        // we have an exportMap
        const exportMap = entry;
  
        exportMap.forEach((entry) => {
          const exportMapEntry = dependencyPackageJson.exports[entry];
          let packageExport;
  
          if (Array.isArray(exportMapEntry)) {
            let fallbackPath;
            let esmPath;
  
            exportMapEntry.forEach((mapItem) => {
              switch (typeof mapItem) {
  
                case 'string':
                  fallbackPath = mapItem;
                  break;
                case 'object':
                  const entryTypes = Object.keys(mapItem);
  
                  if (entryTypes.import) {
                    esmPath = entryTypes.import;
                  } else if (entryTypes.require) {
                    console.error('The package you are importing needs commonjs support.  Please use our commonjs plugin to fix this error.');
                    fallbackPath = entryTypes.require;
                  } else if (entryTypes.default) {
                    console.warn('The package you are requiring may need commonjs support.  If this module is not working for you, consider adding our commonjs plugin.');
                    fallbackPath = entryTypes.default;
                  }
                  break;
                default:
                  console.warn(`Sorry, we were unable to detect the module type for ${mapItem} :(.  please consider opening an issue to let us know about your use case.`);
                  break;
  
              }
            });
  
            packageExport = esmPath
              ? esmPath
              : fallbackPath;
          } else if (exportMapEntry.import || exportMapEntry.default) {
            packageExport = exportMapEntry.import
              ? exportMapEntry.import
              : exportMapEntry.default;
            
            // use the dependency itself as an entry in the importMap
            if (entry === '.') {
              updateImportMap(dependency, `/node_modules/${dependency}/${packageExport.replace('./', '')}`);
            }
          } else if (exportMapEntry.endsWith && (exportMapEntry.endsWith('.js') || exportMapEntry.endsWith('.mjs')) && exportMapEntry.indexOf('*') < 0) {
            // is probably a file, so _not_ an export array, package.json, or wildcard export
            packageExport = exportMapEntry;
          }
  
          if (packageExport) {
            const packageExportLocation = path.join(absoluteNodeModulesLocation, packageExport.replace('./', ''));

            // check all exports of an exportMap entry
            // to make sure those deps get added to the importMap
            if (packageExport.endsWith('js')) {
              const moduleContents = fs.readFileSync(packageExportLocation);

              walkModule(moduleContents, dependency);
              updateImportMap(`${dependency}${entry.replace('.', '')}`, `/node_modules/${dependency}/${packageExport.replace('./', '')}`);
            } else if (fs.lstatSync(packageExportLocation).isDirectory()) {
              fs.readdirSync(packageExportLocation)
                .filter(file => file.endsWith('.js') || file.endsWith('.mjs'))
                .forEach((file) => {
                  updateImportMap(`${dependency}/${packageExport.replace('./', '')}${file}`, `/node_modules/${dependency}/${packageExport.replace('./', '')}${file}`);
                });
            } else {
              console.warn('Warning, not able to handle export', `${dependency}/${packageExport}`);
            }
          }
        });

        walkPackageJson(dependencyPackageJson);
      } else {
        const packageEntryPointPath = path.join(absoluteNodeModulesLocation, entry);

        // sometimes a main file is actually just an empty string... :/
        if (fs.existsSync(packageEntryPointPath)) {
          const packageEntryModule = fs.readFileSync(packageEntryPointPath, 'utf-8');
    
          walkModule(packageEntryModule, dependency);
          updateImportMap(dependency, `/node_modules/${dependency}/${entry}`);
          walkPackageJson(dependencyPackageJson);
        }
      }
    }
  });
};

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
    const absoluteNodeModulesLocation = getNodeModulesResolveLocationForPackageName(packageName);
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
    return new Promise((resolve, reject) => {
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
          ? require(path.join(userWorkspace, 'package.json')) // its a monorepo?
          : fs.existsSync(`${process.cwd()}/package.json`)
            ? require(path.join(process.cwd(), 'package.json'))
            : {};
        
        // walk the project's pacakge.json for all its direct dependencies
        // for each entry found in dependencies, find its entry point
        // then walk its entry point (e.g. index.js) for imports / exports to add to the importMap
        // and then walk its package.json for transitive dependencies and all those import / exports
        walkPackageJson(userPackageJson);

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

module.exports = [{
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