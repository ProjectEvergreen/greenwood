/* eslint-disable max-depth,complexity */
const importMap = {};

function updateImportMap(key, value) {
  importMap[key.replace('./', '')] = value.replace('./', '');
}

function walkPackageForExports(dependency, packageJson) {
  const { exports, module, main } = packageJson;

  // console.log('walkPackageForExports', { dependency, exports, module, main });

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
          }
        } else if (exports[exp].default) {
          if (exp === '.') {
            updateImportMap(dependency, `/node_modules/${dependency}/${exports[exp].default}`);
          } else {
            updateImportMap(`${dependency}/${exp}`, `/node_modules/${dependency}/${exports[exp].default}`);
          }
        }
      } else {
        // TODO, probably
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
      // TODO why empty main :/
      // https://unpkg.com/browse/@types/trusted-types@2.0.7/package.json
      if (dependency !== '@types/trusted-types') {
        const resolved = import.meta.resolve(dependency);
        const resolvedRoot = new URL(`./${dependency}/`, resolved.split(dependency)[0]);
        const resolvedPackageJson = (await import(new URL('./package.json', resolvedRoot), { with: { type: 'json' } })).default;

        walkPackageForExports(dependency, resolvedPackageJson);

        if (resolvedPackageJson.dependencies) {
          for (const dependency in resolvedPackageJson.dependencies) {
            // TODO why empty main
            // https://unpkg.com/browse/@types/trusted-types@2.0.7/package.json
            if (dependency !== '@types/trusted-types') {
              // TODO do we have to duplicate this look here and above??
              const resolved = import.meta.resolve(dependency);
              const resolvedRoot = new URL(`./${dependency}/`, resolved.split(dependency)[0]);
              const resolvedPackageJson = (await import(new URL('./package.json', resolvedRoot), { with: { type: 'json' } })).default;

              walkPackageForExports(dependency, resolvedPackageJson);
              // console.log('### resolve direct dependency', { dependency, resolved, resolvedRoot: resolvedRoot.href, resolvedPackageJson })
              await walkPackageJson(resolvedPackageJson);
            }
          }
        }
      }
    }
  } catch (e) {
    console.error('Error building up import map', e);
  }

  console.log({ importMap });
  return importMap;
}

export {
  walkPackageJson
};