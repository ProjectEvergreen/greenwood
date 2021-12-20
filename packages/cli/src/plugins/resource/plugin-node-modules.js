/* eslint-disable max-depth,complexity */
/*
 * 
 * Detects and fully resolves requests to node_modules and handles creating an importMap.
 *
 */
import * as acorn from 'acorn';
import fs from 'fs';
import path from 'path';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import { getNodeModulesLocationForPackage, getPackageNameFromUrl } from '../../lib/node-modules-utils.js';
import { ResourceInterface } from '../../lib/resource-interface.js';
import * as walk from 'acorn-walk';

const importMap = {};

const updateImportMap = (entry, entryPath) => {

  if (path.extname(entryPath) === '') {
    entryPath = `${entryPath}.js`;
  }

  importMap[entry] = entryPath;
};

const getPackageEntryPath = async (packageJson) => {
  let entry = packageJson.exports
    ? Object.keys(packageJson.exports) // first favor export maps first
    : packageJson.module // next favor ESM entry points
      ? packageJson.module
      : packageJson.main && packageJson.main !== '' // then favor main
        ? packageJson.main
        : 'index.js'; // lastly, fallback to index.js

  // use .mjs version if it exists, for packages like redux
  if (!Array.isArray(entry) && fs.existsSync(`${await getNodeModulesLocationForPackage(packageJson.name)}/${entry.replace('.js', '.mjs')}`)) {
    entry = entry.replace('.js', '.mjs');
  }

  return entry;
};

const walkModule = async (module, dependency, packageEntryPointPath) => {
  console.debug('WALK MODULE', dependency);
  console.debug('packageEntryPointPath', packageEntryPointPath);
  walk.simple(acorn.parse(module, {
    ecmaVersion: '2020',
    sourceType: 'module'
  }), {
    async ImportDeclaration(node) {
      let { value: sourceValue } = node.source;
      const absoluteNodeModulesLocation = await getNodeModulesLocationForPackage(dependency);

      console.debug('@@@@@@@@@@ ImportDeclaration', sourceValue);
      // TODO should be handled just like a ./ or ../../../
      if (path.extname(sourceValue) === '' && sourceValue.indexOf('http') !== 0 && sourceValue.indexOf('./') < 0) {        
        if (!importMap[sourceValue]) {
          // found a _new_ bare import for ${sourceValue}
          // we should add this to the importMap and walk its package.json for more transitive deps
          const realLocation = path.join(absoluteNodeModulesLocation.replace(dependency, ''), `${sourceValue}/index.js`);
          console.debug('realLocation', realLocation);
          // TODO
          if (fs.existsSync(realLocation)) {
            // updateImportMap(sourceValue, `/node_modules/${sourceValue}/index.js`);
            // const moduleContents = fs.readFileSync(realLocation, 'utf-8');
            // console.debug('going deep!!!!');
            // await walkModule(moduleContents, dependency);
          } else {
            updateImportMap(sourceValue, `/node_modules/${sourceValue}`);
          }
        }
        
        await walkPackageJson(path.join(absoluteNodeModulesLocation, 'package.json'));
        // TODO should be handled just like a ./ or ../../../
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
          await walkModule(moduleContents, dependency);
          // TODO should be handled just like a ./ or ../../../
          updateImportMap(`${dependency}/${sourceValue.replace('./', '')}`, `/node_modules/${dependency}/${sourceValue.replace('./', '')}`);
        }
      }
    },
    async ExportNamedDeclaration(node) {
      const sourceValue = node && node.source ? node.source.value : '';
      // const absoluteNodeModulesLocation = await getNodeModulesLocationForPackage(dependency);

      if (sourceValue !== '' && sourceValue.indexOf('http') !== 0) {
        // TODO should be handled just like a ./ or ../../../
        if (sourceValue.indexOf('.') === 0) {
          // TODO should be handled just like a ./ or ../../../
          if (sourceValue.indexOf('../') === 0) {
            // const absolutePath = path.resolve(path.dirname(packageEntryPointPath), sourceValue);
            // const entry = `${dependency}/${sourceValue.replace('../', 'internal/')}`;
            // const entryPath = absolutePath.replace(process.cwd(), '');
            // console.debug('it has two dot(s)!', sourceValue);
            // console.debug('absolutePath???????', absolutePath);
            // console.debug('ENTRY', entry);
            // console.debug('PATH', entryPath);
            // updateImportMap(entry, entryPath);
          } else {
            console.debug('it has one dot!', sourceValue);
            // TODO should be handled just like a ./ or ../../../
            updateImportMap(`${dependency}/${sourceValue.replace('./', '')}`, `/node_modules/${dependency}/${sourceValue.replace('./', '')}`);
          }
        } else {
          // console.debug('it has NO dots!!!!');
          // updateImportMap(sourceValue, `/node_modules/${sourceValue}`);
          // updateImportMap(sourceValue, `/node_modules/${sourceValue}/index.js`);
        }
      }
    },
    ExportAllDeclaration(node) {
      const sourceValue = node && node.source ? node.source.value : '';

      console.debug('export all!', sourceValue);
      if (sourceValue !== '' && sourceValue.indexOf('http') !== 0) {
        if (sourceValue.indexOf('.') === 0) {
          // TODO should be handled just like a ./ or ../../../
          updateImportMap(`${dependency}/${sourceValue.replace('./', '')}`, `/node_modules/${dependency}/${sourceValue.replace('./', '')}`);
        } else {
          updateImportMap(sourceValue, `/node_modules/${sourceValue}`);
          // TODO updateImportMap(sourceValue, `/node_modules/${sourceValue}/index.js`);
        }
      }
    }
  });
};

const walkPackageJson = async (packageJson = {}) => {
  // while walking a package.json we need to find its entry point, e.g. index.js
  // and then walk that for import / export statements
  // and walk its package.json for its dependencies

  for (const dependency of Object.keys(packageJson.dependencies || {})) {
    const dependencyPackageRootPath = path.join(process.cwd(), './node_modules', dependency);
    const dependencyPackageJsonPath = path.join(dependencyPackageRootPath, 'package.json');
    const dependencyPackageJson = JSON.parse(fs.readFileSync(dependencyPackageJsonPath, 'utf-8'));
    const entry = await getPackageEntryPath(dependencyPackageJson);
    const isJavascriptPackage = Array.isArray(entry) || typeof entry === 'string' && entry.endsWith('.js') || entry.endsWith('.mjs');

    if (isJavascriptPackage) {
      const absoluteNodeModulesLocation = await getNodeModulesLocationForPackage(dependency);

      // https://nodejs.org/api/packages.html#packages_determining_module_system
      if (Array.isArray(entry)) {
        // we have an exportMap
        const exportMap = entry;
  
        for (const entry of exportMap) {
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
            // TODO should be handled just like a ./ or ../../../
            if (entry === '.') {
              updateImportMap(dependency, `/node_modules/${dependency}/${packageExport.replace('./', '')}`);
            }
          } else if (exportMapEntry.endsWith && (exportMapEntry.endsWith('.js') || exportMapEntry.endsWith('.mjs')) && exportMapEntry.indexOf('*') < 0) {
            // is probably a file, so _not_ an export array, package.json, or wildcard export
            packageExport = exportMapEntry;
          }
  
          if (packageExport) {
            // TODO should be handled just like a ./ or ../../../
            const packageExportLocation = path.join(absoluteNodeModulesLocation, packageExport.replace('./', ''));

            // check all exports of an exportMap entry
            // to make sure those deps get added to the importMap
            if (packageExport.endsWith('js')) {
              const moduleContents = fs.readFileSync(packageExportLocation);

              await walkModule(moduleContents, dependency);
              // TODO should be handled just like a ./ or ../../../
              updateImportMap(`${dependency}${entry.replace('.', '')}`, `/node_modules/${dependency}/${packageExport.replace('./', '')}`);
            } else if (fs.lstatSync(packageExportLocation).isDirectory()) {
              fs.readdirSync(packageExportLocation)
                .filter(file => file.endsWith('.js') || file.endsWith('.mjs'))
                .forEach((file) => {
                  // TODO should be handled just like a ./ or ../../../
                  updateImportMap(`${dependency}/${packageExport.replace('./', '')}${file}`, `/node_modules/${dependency}/${packageExport.replace('./', '')}${file}`);
                });
            } else {
              console.warn('Warning, not able to handle export', `${dependency}/${packageExport}`);
            }
          }
        }

        await walkPackageJson(dependencyPackageJson);
      } else {
        const packageEntryPointPath = path.join(absoluteNodeModulesLocation, entry);

        // sometimes a main file is actually just an empty string... :/
        if (fs.existsSync(packageEntryPointPath)) {
          const packageEntryModule = fs.readFileSync(packageEntryPointPath, 'utf-8');
    
          console.debug('1111', dependency);
          await walkModule(packageEntryModule, dependency, packageEntryPointPath);
          // TODO should be handled just like a ./ or ../../../
          updateImportMap(dependency, `/node_modules/${dependency}/${entry.replace('./', '')}`);
          await walkPackageJson(dependencyPackageJson);
        }
      }
    }
  }
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
        
        // walk the project's pacakge.json for all its direct dependencies
        // for each entry found in dependencies, find its entry point
        // then walk its entry point (e.g. index.js) for imports / exports to add to the importMap
        // and then walk its package.json for transitive dependencies and all those import / exports
        await walkPackageJson(userPackageJson);

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