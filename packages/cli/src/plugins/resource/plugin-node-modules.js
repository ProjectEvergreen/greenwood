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

        Object.keys(userPackageJson.dependencies || {}).forEach(dependency => {
          const packageRootPath = path.join(process.cwd(), './node_modules', dependency);
          const packageJsonPath = path.join(packageRootPath, 'package.json');
          const packageJson = require(packageJsonPath);
          const packageEntryPointPath = path.join(process.cwd(), './node_modules', dependency, packageJson.main);
          const packageFileContents = fs.readFileSync(packageEntryPointPath, 'utf-8');

          walk.simple(acorn.parse(packageFileContents, { sourceType: 'module' }), {
            ImportDeclaration(node) {
              // console.log('Found a ImportDeclaration');
              const sourceValue = node.source.value;

              if (sourceValue.indexOf('.') !== 0 && sourceValue.indexOf('http') !== 0) {
                // console.log(`found a bare import for ${sourceValue}!!!!!`);
                importMap[sourceValue] = `/node_modules/${sourceValue}`;
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
          
          importMap[dependency] = `/node_modules/${dependency}/${packageJson.main}`;
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