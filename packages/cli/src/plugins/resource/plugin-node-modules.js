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
  walk.simple(acorn.parse(module, { sourceType: 'module' }), {
    ImportDeclaration(node) {
      let { value: sourceValue } = node.source;
      // console.log('Found a ImportDeclaration', sourceValue);

      if (path.extname(sourceValue) === '' && sourceValue.indexOf('http') !== 0 && sourceValue.indexOf('./') < 0) {
        // console.debug(`!!!! found a new bare import for ${sourceValue}, we should probably and this to the importMap and walk this`);
        
        if (!importMap[sourceValue]) {
          importMap[sourceValue] = `/node_modules/${sourceValue}`;
        }
        
        walkPackageJson(path.join(process.cwd(), 'node_modules', sourceValue, 'package.json'));
      } else if (sourceValue.indexOf('./') < 0) {
        // console.debug(`@@@@@@@@@@@@@@ adding ${sourceValue} to importMap`);
        importMap[sourceValue] = `/node_modules/${sourceValue}`;
      } else {
        // console.debug(`?????????? do something with ${sourceValue}?`);
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
      // console.log('Found a ExportNamedDeclaration');
      const sourceValue = node && node.source ? node.source.value : '';

      if (sourceValue.indexOf('.') !== 0 && sourceValue.indexOf('http') !== 0) {
        // console.log(`found a bare export for ${sourceValue}!!!!!`);
        importMap[sourceValue] = `/node_modules/${sourceValue}`;
      }
    }
  });
};

const walkPackageJson = (packageJson = {}) => {
  Object.keys(packageJson.dependencies || {}).forEach(dependency => {
    const dependencyPackageRootPath = path.join(process.cwd(), './node_modules', dependency);
    const dependencyPackageJsonPath = path.join(dependencyPackageRootPath, 'package.json');
    const dependencyPackageJson = require(dependencyPackageJsonPath);
    const entry = getPackageEntryPath(dependencyPackageJson);
    const packageEntryPointPath = path.join(process.cwd(), './node_modules', dependency, entry);
    const packageEntryModule = fs.readFileSync(packageEntryPointPath, 'utf-8');

    // console.debug(`########entry path for ${dependency} =>`, packageEntryPointPath);
    walkModule(packageEntryModule, dependency);

    // console.debug('########## ADDING => ', `/node_modules/${dependency}/${entry}`);
    importMap[dependency] = `/node_modules/${dependency}/${entry}`;

    // console.debug(`########## WALKING for ${dependencyPackageJson.name}???????? => `, dependencyPackageJson.dependencies);
    walkPackageJson(dependencyPackageJson);
  });
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
    return path.extname(url) === '.mjs' || path.extname(url) === '' && fs.existsSync(`${url}.js`);
  }

  serve(url) {
    return new Promise(async(resolve, reject) => {
      try {
        const fullUrl = path.extname(url) === '' ? `${url}.js` : url; 
        const body = await fs.promises.readFile(fullUrl, 'utf-8');
    
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

  shouldIntercept(url, headers) {
    return headers['content-type'] === 'text/html';
  }

  async intercept(contents) {
    return new Promise((resolve, reject) => {
      try {
        const { userWorkspace } = this.compilation.context;
        let newContents = contents;
        
        newContents = newContents.replace(/type="module"/g, 'type="module-shim"');

        const userPackageJson = fs.existsSync(`${userWorkspace}/package.json`)
          ? require(path.join(userWorkspace, 'package.json')) // its a monorepo?
          : fs.existsSync(`${process.cwd()}/package.json`)
            ? require(path.join(process.cwd(), 'package.json'))
            : {};

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