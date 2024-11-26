import fs from 'fs/promises';

/* eslint-disable max-depth,complexity */
const importMap = {};
const extensionFilters = ['map', 'd.ts'];

function updateImportMap(key, value) {
  importMap[key.replace('./', '')] = value.replace('./', '');
}

// wrapper around import.meta.resolve to provide graceful error handling / logging
// as sometimes a package.json has no main field :/
// https://unpkg.com/browse/@types/trusted-types@2.0.7/package.json
// https://github.com/nodejs/node/issues/49445#issuecomment-2484334036
function resolveBareSpecifier(specifier) {
  let resolvedPath;

  try {
    resolvedPath = import.meta.resolve(specifier);
  } catch (e) {
    // console.log({ e });
    // TODO console.log(`WARNING: unable to resolve specifier \`${specifier}\``);
  }

  return resolvedPath;
}

/*
 * Find root directory for a package based on result of import.meta.resolve, since dependencyName could show in multiple places
 * until this becomes a thing - https://github.com/nodejs/node/issues/49445
 * {
 *   dependencyName: 'lit-html',
 *   resolved: 'file:///path/to/project/greenwood-lit-ssr/node_modules/.pnpm/lit-html@3.2.1/node_modules/lit-html/node/lit-html.js',
 *   root: 'file:///path/to/project/greenwood-lit-ssr/node_modules/.pnpm/lit-html@3.2.1/node_modules/lit-html/package.json'
 *  }
 */
function derivePackageRoot(dependencyName, resolved) {
  const root = resolved.slice(0, resolved.lastIndexOf(`/node_modules/${dependencyName}/`));
  const derived = `${root}/node_modules/${dependencyName}/`;

  return derived;
}

// https://nodejs.org/api/packages.html#subpath-patterns
async function walkExportPatterns(dependency, exp, resolvedRoot) {
  if (exp.endsWith('*')) {
    const dir = new URL(exp.replace('*', ''), resolvedRoot);
    const files = await fs.readdir(dir);

    files
      .filter((file) => {
        let shouldNotFilter = true;

        extensionFilters.forEach((extFilter) => {
          if (file.endsWith(extFilter)) {
            shouldNotFilter = false;
          }
        });

        return shouldNotFilter;
      })
      .forEach((file) => {
        updateImportMap(`${dependency}/${exp.replace('/*', '')}/${file}`, `/node_modules/${dependency}/${exp.replace('/*', '')}/${file}`);
      });
  } else {
    // TODO
    // "./feature/*": "./feature/*.js",
  }
}

async function walkPackageForExports(dependency, packageJson, resolvedRoot) {
  const { exports, module, main } = packageJson;

  if (exports) {
    for (const exp in exports) {
      if (typeof exports[exp] === 'object') {
        if (exports[exp].import) {
          if (typeof exports[exp].import === 'object') {
            if (exp === '.') {
              updateImportMap(dependency, `/node_modules/${dependency}/${exports[exp].import.default ?? exports[exp].import }`);
            } else {
              updateImportMap(`${dependency}/${exp}`, `/node_modules/${dependency}/${exports[exp].import.default ?? exports[exp].import}`);
            }
          } else {
            // https://unpkg.com/browse/redux@5.0.1/package.json
            updateImportMap(dependency, `/node_modules/${dependency}/${exports[exp].import }`);
          }
        } else if (exports[exp].default) {
          if (exp === '.') {
            updateImportMap(dependency, `/node_modules/${dependency}/${exports[exp].default}`);
          } else {
            updateImportMap(`${dependency}/${exp}`, `/node_modules/${dependency}/${exports[exp].default}`);
          }
        } else {
          // TODO what to do here?  what else is there besides default?
        }
      } else {
        if (exp === '.') {
          updateImportMap(dependency, `/node_modules/${dependency}/${exports[exp]}`);
        } else if (exp.indexOf('*') >= 0) {
          await walkExportPatterns(dependency, exp, resolvedRoot);
        } else {
          updateImportMap(`${dependency}/${exp}`, `/node_modules/${dependency}/${exp}`);
        }
      }
    }
  } else if (module || main) {
    updateImportMap(dependency, `/node_modules/${dependency}/${module ?? main}`);
  }
}

// https://nodejs.org/api/packages.html#package-entry-points
async function walkPackageJson(packageJson = {}) {
  try {
    for (const dependency of Object.keys(packageJson.dependencies || {})) {
      const resolved = resolveBareSpecifier(dependency);

      if (resolved) {
        const resolvedRoot = derivePackageRoot(dependency, resolved);
        const resolvedPackageJson = (await import(new URL('./package.json', resolvedRoot), { with: { type: 'json' } })).default;

        walkPackageForExports(dependency, resolvedPackageJson, resolvedRoot);

        if (resolvedPackageJson.dependencies) {
          for (const dependency in resolvedPackageJson.dependencies) {
            const resolved = resolveBareSpecifier(dependency);

            if (resolved) {
              const resolvedRoot = derivePackageRoot(dependency, resolved);
              const resolvedPackageJson = (await import(new URL('./package.json', resolvedRoot), { with: { type: 'json' } })).default;

              walkPackageForExports(dependency, resolvedPackageJson, resolvedRoot);

              await walkPackageJson(resolvedPackageJson);
            }
          }
        }
      }
    }
  } catch (e) {
    console.error('Error building up import map', e);
  }

  return importMap;
}

// could probably go somewhere else, in a util?
function mergeImportMap(html = '', map = {}, shouldShim = false) {
  const importMapType = shouldShim ? 'importmap-shim' : 'importmap';
  const hasImportMap = html.indexOf(`script type="${importMapType}"`) > 0;
  const danglingComma = hasImportMap ? ',' : '';
  const importMap = JSON.stringify(map, null, 2).replace('}', '').replace('{', '');

  if (Object.entries(map).length === 0) {
    return html;
  }

  if (hasImportMap) {
    return html.replace('"imports": {', `
      "imports": {
        ${importMap}${danglingComma}
    `);
  } else {
    return html.replace('<head>', `
      <head>
      <script type="${importMapType}">
        {
          "imports": {
            ${importMap}
          }
        }
      </script>
    `);
  }
}

export {
  walkPackageJson,
  mergeImportMap
};