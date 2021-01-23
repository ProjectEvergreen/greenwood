/*
 * 
 * Detects and fully resolve srequest to node_modules.
 *
 */
const acorn = require('acorn');
const fs = require('fs');
const path = require('path');
const { ResourceInterface } = require('../../lib/resource-interface');
const walk = require('acorn-walk');

const getPackageEntryPath = (packageJson) => {
  // "main": "lib/index.js",
  // "module": "es/index.js",
  // "jsnext:main": "es/index.js"
  let entry = packageJson.module 
    ? packageJson.module // favor ESM entry points first
    : packageJson.main;

  if (fs.existsSync(`${process.cwd()}/node_modules/${packageJson.name}/${entry.replace('.js', '.mjs')}`)) {
    console.debug('????????? has .mjs option, use?', `${process.cwd()}/${packageJson.name}/${entry.replace('.js', '.mjs')}`);
    entry = entry.replace('.js', '.mjs');
  }

  console.debug(`getPackageEntryPath for ${packageJson.name} =>`, entry);

  return entry;
};

class NodeModulesResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['*'];
  }

  shouldResolve(url) {
    return url.indexOf('node_modules/') >= 0;
  }

  async resolve(url) {
    return new Promise((resolve, reject) => {
      try {
        const relativeUrl = url.replace(this.compilation.context.userWorkspace, '');
        const nodeModulesUrl = path.join(process.cwd(), relativeUrl);

        resolve(nodeModulesUrl);
      } catch (e) {
        console.error(e);
        reject(e);
      }
    });
  }

  shouldServe(url) {
    return path.extname(url) === '.mjs';
  }

  serve(url) {
    return new Promise(async(resolve, reject) => {
      try {
        const body = await fs.promises.readFile(url, 'utf-8');
    
        // exports['default'] = result;
        if (body.indexOf('exports[\'default\'] = ') >= 0) {
          body = `
            let exports = {}\n
            ${body}
          `;
          body = body.replace('exports[\'default\'] = ', 'export default ');
          console.debug('handled a weird edge case!!!', body);
        }

        resolve({
          body,
          contentType: 'text/javascript'
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  shouldIntercept(url) {
    return path.extname(url) === '';
  }

  async intercept(contents) {
    return new Promise((resolve, reject) => {
      try {
        const { userWorkspace } = this.compilation.context;
        let newContents = contents;
        
        newContents = newContents.replace(/type="module"/g, 'type="module-shim"');

        const importMap = {};
        const userPackageJson = fs.existsSync(`${userWorkspace}/package.json`)
          ? require(path.join(userWorkspace, 'package.json')) // its a monorepo?
          : fs.existsSync(`${process.cwd()}/package.json`)
            ? require(path.join(process.cwd(), 'package.json'))
            : {};

        // console.debug('userPackageJson', userPackageJson);
        // console.debug('dependencies', userPackageJson.dependencies);

        // TODO will need to track for non ESM packages, like CJS, and less likely, UMD and AMD
        // maybe just use snowpack?
        Object.keys(userPackageJson.dependencies || {}).forEach(dependency => {
          const packageRootPath = path.join(process.cwd(), './node_modules', dependency);
          const packageJsonPath = path.join(packageRootPath, 'package.json');
          const packageJson = require(packageJsonPath);
          const entry = getPackageEntryPath(packageJson);
          const packageEntryPointPath = path.join(process.cwd(), './node_modules', dependency, entry);
          const packageFileContents = fs.readFileSync(packageEntryPointPath, 'utf-8');
          console.debug(`########entry path for ${dependency} =>`, packageEntryPointPath);

          // console.debug(acorn.parse(packageFileContents, { sourceType: 'module' }));
          walk.simple(acorn.parse(packageFileContents, { sourceType: 'module' }), {
            ImportDeclaration(node) {
              // console.log('Found a ImportDeclaration');
              let { value: sourceValue } = node.source;

              if (sourceValue.indexOf('.') !== 0 && sourceValue.indexOf('http') !== 0) {
                console.debug(`found a bare import for ${sourceValue}!!!!!`);

                if (path.extname(sourceValue) === '' && !userPackageJson.dependencies[sourceValue]) {
                  console.debug('!!!!!!! new bare import dependency of dependency, might need to resolve to a path first');
                  const sourcePackageJsonPath = path.join(process.cwd(), './node_modules', sourceValue, 'package.json');
                  const packageJson = require(sourcePackageJsonPath);
                  const entry = getPackageEntryPath(packageJson);

                  console.debug('file resolve => ', `/node_modules/${sourceValue}/${entry}`);
                  importMap[sourceValue] = `/node_modules/${sourceValue}/${entry}`;
                } else {
                  importMap[sourceValue] = `/node_modules/${sourceValue}`;
                }
              }
            },
            ExportNamedDeclaration(node) {
              // console.log('Found a ExportNamedDeclaration');
              const sourceValue = node && node.source ? node.source.value : '';

              if (sourceValue.indexOf('.') !== 0 && sourceValue.indexOf('http') !== 0) {
                // console.log(`found a bare export for ${sourceValue}!!!!!`);
                importMap[sourceValue] = `/node_modules/${sourceValue}`;
              }
            }
          });
          
          importMap[dependency] = `/node_modules/${dependency}/${entry}`;
        });

        newContents = newContents.replace('<head>', `
          <head>
            <script defer src="/node_modules/es-module-shims/dist/es-module-shims.js"></script>
            <script type="importmap-shim">
              {
                "imports": ${JSON.stringify(importMap, null, 1)}
              }
            </script>
        `);

        resolve(newContents);
      } catch (e) {
        reject(e);
      }
    });
  }
}

module.exports = {
  type: 'resource',
  name: 'plugin-node-modules',
  provider: (compilation, options) => new NodeModulesResource(compilation, options)
};