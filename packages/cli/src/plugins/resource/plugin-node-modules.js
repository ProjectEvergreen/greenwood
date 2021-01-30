/*
 * 
 * Detects and fully resolves requests to node_modules.
 *
 */
const acorn = require('acorn');
const fs = require('fs');
const path = require('path');
const { ResourceInterface } = require('../../lib/resource-interface');
const walk = require('acorn-walk');

const importMap = {};

// https://nodejs.org/api/packages.html#packages_determining_module_system
const getPackageEntryPath = (packageJson) => {
  let entry = packageJson.module 
    ? packageJson.module // favor ESM entry points first
    : packageJson.main
      ? packageJson.main
      : 'index.js';

  // use .mjs version of it exists, for packages like redux
  if (fs.existsSync(`${process.cwd()}/node_modules/${packageJson.name}/${entry.replace('.js', '.mjs')}`)) {
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

      if (path.extname(sourceValue) === '' && sourceValue.indexOf('http') !== 0 && sourceValue.indexOf('./') < 0) {        
        if (!importMap[sourceValue]) {
          // found a _new_ bare import for ${sourceValue}
          // we should add this to the importMap and walk its package.json for more transitive deps
          importMap[sourceValue] = `/node_modules/${sourceValue}`;
        }
        
        walkPackageJson(path.join(process.cwd(), 'node_modules', sourceValue, 'package.json'));
      } else if (sourceValue.indexOf('./') < 0) {
        // adding a relative import
        importMap[sourceValue] = `/node_modules/${sourceValue}`;
      } else {
        // walk this module for all its dependencies
        sourceValue = sourceValue.indexOf('.js') < 0
          ? `${sourceValue}.js`
          : sourceValue;

        if (fs.existsSync(path.join(process.cwd(), 'node_modules', dependency, sourceValue))) {
          const moduleContents = fs.readFileSync(path.join(process.cwd(), 'node_modules', dependency, sourceValue));
          walkModule(moduleContents, dependency);
        }
      }
    },
    ExportNamedDeclaration(node) {
      const sourceValue = node && node.source ? node.source.value : '';

      if (sourceValue !== '' && sourceValue.indexOf('.') !== 0 && sourceValue.indexOf('http') !== 0) {
        importMap[sourceValue] = `/node_modules/${sourceValue}`;
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
    const packageEntryPointPath = path.join(process.cwd(), './node_modules', dependency, entry);
    const packageEntryModule = fs.readFileSync(packageEntryPointPath, 'utf-8');

    walkModule(packageEntryModule, dependency);

    importMap[dependency] = `/node_modules/${dependency}/${entry}`;

    walkPackageJson(dependencyPackageJson);
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

  async shouldServe(url) {
    return Promise.resolve(path.extname(url) === '.mjs' 
      || (path.extname(url) === '' && fs.existsSync(`${url}.js`))
      || (path.extname(url) === '.js' && (/node_modules/).test(url)));
  }

  async serve(url) {
    return new Promise(async(resolve, reject) => {
      try {
        const fullUrl = path.extname(url) === '' ? `${url}.js` : url;
        const body = await fs.promises.readFile(fullUrl);

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
    return Promise.resolve(headers['content-type'] === 'text/html');
  }

  async intercept(url, body) {
    return new Promise((resolve, reject) => {
      try {
        const { userWorkspace } = this.compilation.context;
        let newContents = body;
        
        newContents = newContents.replace(/type="module"/g, 'type="module-shim"');

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