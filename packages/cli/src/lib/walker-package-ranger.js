import fs from 'fs';

/* eslint-disable max-depth,complexity */
// priority if from L -> R
const SUPPORTED_EXPORT_CONDITIONS = ['import', 'module-sync', 'default'];
const IMPORT_MAP_RESOLVED_PREFIX = '/~';
const importMap = {};
const diagnostics = {};

function updateImportMap(key, value, resolvedRoot) {
  if (!importMap[key.replace('./', '')]) {
    importMap[key.replace('./', '')] = `${IMPORT_MAP_RESOLVED_PREFIX}${resolvedRoot.replace('file://', '')}${value.replace('./', '')}`;
  }
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
    diagnostics[specifier] = `ERROR (${e.code}): unable to resolve specifier => \`${specifier}\` \n${e.message}`;
  }

  return resolvedPath;
}

/*
 * Find root directory for a package based on result of import.meta.resolve, since dependencyName could show in multiple places
 * until this becomes a thing - https://github.com/nodejs/node/issues/49445
 * {
 *   dependencyName: 'lit-html',
 *   resolved: 'file:///path/to/project/greenwood-lit-ssr/node_modules/.pnpm/lit-html@3.2.1/node_modules/lit-html/node/lit-html.js',
 *   root: 'file:///path/to/project/greenwood-lit-ssr/node_modules/.pnpm/lit-html@3.2.1/node_modules/lit-html/
 *  }
 */
function derivePackageRoot(resolved) {
  // can't rely on the specifier, for example in monorepos
  // where @foo/bar may point to a non node_modules location
  // e.g. packages/some-namespace/package.json
  // so we walk backwards looking for nearest package.json
  const segments = resolved
    .replace('file://', '')
    .split('/')
    .filter(segment => segment !== '')
    .reverse();
  let root = resolved.replace(segments[0], '');

  for (const segment of segments.slice(1)) {
    if (fs.existsSync(new URL('./package.json', root))) {
      // we have to check that this package.json actually has as a name AND version
      // https://github.com/moment/luxon/issues/1543#issuecomment-2546858540
      // https://github.com/ProjectEvergreen/greenwood/issues/1349
      const resolvedPackageJson = JSON.parse(fs.readFileSync(new URL('./package.json', root), 'utf-8'));
      const { name, version } = resolvedPackageJson;

      if (name && version) {
        break;
      }
    }

    root = root.replace(`${segment}/`, '');
  }

  return root;
}

// Helper function to convert export patterns to a regex (thanks ChatGPT :D)
function globToRegex(pattern) {
  // Escape special regex characters
  pattern = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');

  // Replace glob `*` with regex `[^/]*` (any characters except slashes)
  pattern = pattern.replace(/\*/g, '[^/]*');

  // Replace glob `**` with regex `(.*)` (zero or more directories or files)
  // pattern = pattern.replace(/\*\*/g, '(.*)');

  // Return the final regex
  return new RegExp('^' + pattern + '$');
}

// convert path to its lowest common root
// e.g. ./img/path/*/index.js -> /img/path
// https://unpkg.com/browse/@uswds/uswds@3.10.0/package.json
function patternRoot(pattern) {
  const segments = pattern.split('/').filter((segment) => segment !== '.');
  let root = '';

  for (const segment of segments) {
    // is there a better way to fuzzy test for a filename other than checking for a dot?
    if (segment.indexOf('*') < 0 && segment.indexOf('.') < 0) {
      root += `/${segment}`;
    } else {
      break;
    }
  }

  return root;
}

/*
 * https://nodejs.org/api/packages.html#subpath-patterns
 *
 * Examples
 * "./icons/*": "./icons/*" - https://unpkg.com/browse/@spectrum-web-components/icons-workflow@1.0.1/package.json
 * "./components/*": "./dist/components/*.js" - https://unpkg.com/browse/@uswds/web-components@0.0.1-alpha/package.json
 * "./src/components/*": "./src/components/* /index.js - https://unpkg.com/browse/@uswds/web-components@0.0.1-alpha/package.json
 */
async function walkExportPatterns(dependency, sub, subValue, resolvedRoot) {
  // find the "deepest" segment we can start from to avoid unnecessary file scanning / crawling
  const rootSubValueOffset = patternRoot(subValue);

  // ideally we can use fs.glob when it comes out of experimental
  // https://nodejs.org/docs/latest-v22.x/api/fs.html#fspromisesglobpattern-options
  function walkDirectoryForExportPatterns(directoryUrl) {
    const filesInDir = fs.readdirSync(directoryUrl);

    filesInDir.forEach(file => {
      const filePathUrl = new URL(`./${file}`, directoryUrl);
      const stat = fs.statSync(filePathUrl);
      const pattern = `${resolvedRoot}${subValue.replace('./', '')}`;
      const regexPattern = globToRegex(pattern);

      if (stat.isDirectory()) {
        walkDirectoryForExportPatterns(new URL(`./${file}/`, directoryUrl));
      } else if (regexPattern.test(filePathUrl.href)) {
        const relativePath = filePathUrl.href.replace(resolvedRoot, '');
        // naive way to offset a subValue pattern to the sub pattern
        // ex. "./js/*": "./packages/*/src/index.js",
        // https://unpkg.com/browse/@uswds/uswds@3.10.0/package.json
        const rootSubRelativePath = relativePath.replace(rootSubValueOffset, '');

        updateImportMap(`${dependency}/${rootSubRelativePath}`, relativePath, resolvedRoot);
      }
    });
  }

  walkDirectoryForExportPatterns(new URL(`.${rootSubValueOffset}/`, resolvedRoot));
}

function trackExportConditions(dependency, exports, sub, condition, resolvedRoot) {
  if (typeof exports[sub] === 'object') {
    // also check for nested conditions of conditions, default to default for now
    // https://unpkg.com/browse/@floating-ui/dom@1.6.12/package.json
    if (sub === '.') {
      updateImportMap(dependency, `${exports[sub][condition].default ?? exports[sub][condition]}`, resolvedRoot);
    } else {
      updateImportMap(`${dependency}/${sub}`, `${exports[sub][condition].default ?? exports[sub][condition]}`, resolvedRoot);
    }
  } else {
    // https://unpkg.com/browse/redux@5.0.1/package.json
    updateImportMap(dependency, `${exports[sub][condition]}`);
  }
}

// https://nodejs.org/api/packages.html#conditional-exports
async function walkPackageForExports(dependency, packageJson, resolvedRoot) {
  const { exports, module, main } = packageJson;

  // favor exports over main / module
  if (exports) {
    for (const sub in exports) {
      /*
       * test for conditional subpath exports
       * 1. import
       * 2. module-sync
       * 3. default
       */
      if (typeof exports[sub] === 'object') {
        let matched = false;

        for (const condition of SUPPORTED_EXPORT_CONDITIONS) {
          if (exports[sub][condition]) {
            matched = true;
            trackExportConditions(dependency, exports, sub, condition, resolvedRoot);
            break;
          }
        }

        if (!matched) {
          // ex. https://unpkg.com/browse/matches-selector@1.2.0/package.json
          diagnostics[dependency] = `no supported export conditions (\`${SUPPORTED_EXPORT_CONDITIONS.join(', ')}\`) for dependency => \`${dependency}\``;
        }
      } else {
        // handle (unconditional) subpath exports
        if (sub === '.') {
          updateImportMap(dependency, `${exports[sub]}`, resolvedRoot);
        } else if (sub.indexOf('*') >= 0) {
          await walkExportPatterns(dependency, sub, exports[sub], resolvedRoot);
        } else {
          updateImportMap(`${dependency}/${sub}`, `${exports[sub]}`, resolvedRoot);
        }
      }
    }
  } else if (module || main) {
    updateImportMap(dependency, `${module ?? main}`, resolvedRoot);
  } else if (fs.existsSync(new URL('./index.js', resolvedRoot))) {
    // if an index.js file exists but with no main entry point, then it should count as a main entry point
    // https://docs.npmjs.com/cli/v7/configuring-npm/package-json#main
    // https://unpkg.com/browse/object-assign@4.1.1/package.json
    updateImportMap(dependency, 'index.js', resolvedRoot);
  } else {
    // ex: https://unpkg.com/browse/uuid@3.4.0/package.json
    diagnostics[dependency] = `WARNING: No supported entry point detected for => \`${dependency}\``;
  }
}

// https://nodejs.org/api/packages.html#package-entry-points
async function walkPackageJson(packageJson = {}) {
  try {
    for (const dependency of Object.keys(packageJson.dependencies || {})) {
      const resolved = resolveBareSpecifier(dependency);

      if (resolved) {
        const resolvedRoot = derivePackageRoot(resolved);
        const resolvedPackageJson = (await import(new URL('./package.json', resolvedRoot), { with: { type: 'json' } })).default;

        walkPackageForExports(dependency, resolvedPackageJson, resolvedRoot);

        if (resolvedPackageJson.dependencies) {
          for (const dependency in resolvedPackageJson.dependencies) {
            const resolved = resolveBareSpecifier(dependency);

            if (resolved) {
              const resolvedRoot = derivePackageRoot(resolved);
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

  return { importMap, diagnostics };
}

export {
  walkPackageJson,
  resolveBareSpecifier,
  derivePackageRoot,
  IMPORT_MAP_RESOLVED_PREFIX
};