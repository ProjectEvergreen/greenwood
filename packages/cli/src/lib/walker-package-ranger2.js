import fs from 'fs';

/* eslint-disable max-depth,complexity */
const importMap = {};
// TODO const extensionFilters = ['map', 'd.ts'];

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

/*
 * https://nodejs.org/api/packages.html#subpath-patterns
 *
 * Examples
 * "./icons/*": "./icons/*" - https://unpkg.com/browse/@spectrum-web-components/icons-workflow@1.0.1/package.json
 * "./components/*": "./dist/components/*.js" - https://unpkg.com/browse/@uswds/web-components@0.0.1-alpha/package.json
 * "./src/components/*": "./src/components/* /index.js - https://unpkg.com/browse/@uswds/web-components@0.0.1-alpha/package.json
 */

// Helper function to match patterns using regular expressions (thanks ChatGPT)
function matchPattern(file, pattern) {
  const regexPattern = globToRegex(pattern);

  return regexPattern.test(file);
}

// Helper function to convert glob pattern to regex (thanks ChatGPT)
function globToRegex(pattern) {
  // Escape special regex characters
  pattern = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');

  // Replace glob `*` with regex `[^/]*` (any characters except slashes)
  pattern = pattern.replace(/\*/g, '[^/]*');

  // Return the final regex
  return new RegExp('^' + pattern + '$');
}

async function walkExportPatterns(dependency, sub, subValue, resolvedRoot) {
  // console.log('walkExportPatterns', { dependency, sub, subValue });
  const segments = subValue.split('/').filter((segment) => segment !== '.');
  let startingSegmentOffset = '';

  // find the "deepest" segment we can start from
  // to avoid unnecessary file scanning / walking
  segments.forEach((segment) => {
    if (segment.indexOf('*') < 0) {
      startingSegmentOffset += `/${segment}`;
    }
  });

  // console.log({ dependency, sub, subValue, resolvedRoot, segments });

  // ideally we can use fs.glob when it comes out of experimental
  // https://nodejs.org/docs/latest-v22.x/api/fs.html#fspromisesglobpattern-options
  function walkDirectory(directoryUrl) {
    const filesInDir = fs.readdirSync(directoryUrl);

    filesInDir.forEach(file => {
      const filePathUrl = new URL(`./${file}`, directoryUrl);
      const stat = fs.statSync(filePathUrl);

      if (stat.isDirectory()) {
        // console.log('>>>>>> keep walking');
        walkDirectory(new URL(`./${file}/`, directoryUrl));
      } else if (matchPattern(filePathUrl.href, `${resolvedRoot}${sub.replace('./', '')}`)) {
        // console.log('$$$$$$ we got a match!');
        const relativePath = filePathUrl.href.replace(resolvedRoot, '');

        // console.log({ startingSegmentOffset, relativePath });
        updateImportMap(`${dependency}${startingSegmentOffset}/${file}`, `/node_modules/${dependency}/${relativePath}`);
      }
    });
  }

  // Start the directory search from the root
  walkDirectory(new URL(`.${startingSegmentOffset}/`, resolvedRoot));
}

// async function walkExportPatterns(dependency, sub, subValue, resolvedRoot) {
//   console.log('walkExportPatterns', { dependency, sub, subValue, resolvedRoot });
//   const exportPatternFiles = [];
//   const segments = subValue.split('/').filter((segment) => segment !== '.');

//   console.log({ segments });

//   segments.reduce((acc, curr, index) => {
//     console.log({ acc, curr, index });
//     const nextSegment = `${acc}/${segments[index + 1]}`;

//     if (curr.indexOf('*') >= 0) {
//       console.log('*** handle wildcard');
//       if (curr === '*') {
//         // if we are NOT at the end of the pattern, keep walking
//         if (index < segments.length - 1) {
//           console.log('nested wildcard, walk nextSegment');
//           return nextSegment;
//         } else {
//           console.log('globbing for files, track');
//           // else grab all these files
//           // TODO handle filtering
//           const dirName = acc.replace(curr, '');
//           // console.log({ dirName });
//           const files = fs.readdirSync(new URL(`./${dirName}/`, resolvedRoot));
//           // console.log({ files });
//           files.forEach((file) => {
//             exportPatternFiles.push(`./${dirName}${file}`);
//           });
//         }
//       }
//     } else {
//       console.log('### handle something else (file or directory)?');
//       const stat = fs.statSync(new URL(`./${acc}`, resolvedRoot));
//       if (stat.isDirectory()) {
//         console.log('is directory, walk nextSegment');
//         return nextSegment;
//       }
//     }

//     // return `${acc}/${segments[index + 1]}`;
//   }, segments[0]);
//   // segments.f()

//   // function walkDirectory(directory) {
//   //   const filesInDir = fs.readdirSync(directory);

//   //   filesInDir.forEach((file) => {
//   //     const fileUrl = new URL(`.${file}`, directory);
//   //     const stat = fs.statSync(fileUrl);

//   //     console.log({ fileUrl, stat });

//   //     if (stat.isDirectory()) {
//   //       console.log('keep walking')
//   //       // Recursively search inside directories
//   //       // walkDirectory(filePath);
//   //     } else {
//   //       console.log('find a match');
//   //     }
//   //     // } else if (matchPattern(filePath, pattern)) {
//   //     //   // If file matches the pattern, add to the result
//   //     //   files.push(filePath);
//   //     // }
//   //   });
//   // }

//   // walkDirectory(resolvedRoot);

//   // if (sub.endsWith('*')) {
//   //   const dir = new URL(sub.replace('*', ''), resolvedRoot);
//   //   const files = await fs.readdir(dir);

//   //   files
//   //     .filter((file) => {
//   //       let shouldNotFilter = true;

//   //       // TODO do we actually need this filter?
//   //       extensionFilters.forEach((extFilter) => {
//   //         if (file.endsWith(extFilter)) {
//   //           shouldNotFilter = false;
//   //         }
//   //       });

//   //       return shouldNotFilter;
//   //     })
//   //     .forEach((file) => {
//   //       updateImportMap(`${dependency}/${sub.replace('/*', '')}/${file}`, `/node_modules/${dependency}/${sub.replace('/*', '')}/${file}`);
//   //     });
//   // } else {
//   //   // TODO
//   //   // "./feature/*": "./feature/*.js",
//   // }

//   console.log({ exportPatternFiles })

//   // ./dist/themes/*
//   // {
//   //   exportPatternFiles: [
//   //     './dist/themes/dark.css',
//   //     './dist/themes/dark.styles.d.ts',
//   //     './dist/themes/dark.styles.js',
//   //     './dist/themes/light.css',
//   //     './dist/themes/light.styles.d.ts',
//   //     './dist/themes/light.styles.js'
//   //   ]
//   // }
//   // expand sub to all subValue
//   exportPatternFiles.forEach((patternFile) => {
//     // if(patternFile.indexOf)
//     if (sub.endsWith('*')) {
//       updateImportMap(`${dependency}/${patternFile}`, `/node_modules/${dependency}/${patternFile}`);
//     }
//   })
//   // TODO apply exportPatternFiles to importMap
// }

// https://nodejs.org/api/packages.html#conditional-exports
async function walkPackageForExports(dependency, packageJson, resolvedRoot) {
  const { exports, module, main } = packageJson;

  // favor exports over main / module
  if (exports) {
    for (const sub in exports) {
      /* test for conditional subpath exports
       * 1. import
       * 2. default
       */
      if (typeof exports[sub] === 'object') {
        if (exports[sub].import) {
          // nested conditions
          if (typeof exports[sub].import === 'object') {
            if (sub === '.') {
              updateImportMap(dependency, `/node_modules/${dependency}/${exports[sub].import.default ?? exports[sub].import }`);
            } else {
              updateImportMap(`${dependency}/${sub}`, `/node_modules/${dependency}/${exports[sub].import.default ?? exports[sub].import}`);
            }
          } else {
            // https://unpkg.com/browse/redux@5.0.1/package.json
            updateImportMap(dependency, `/node_modules/${dependency}/${exports[sub].import }`);
          }
        } else if (exports[sub].default) {
          if (sub === '.') {
            updateImportMap(dependency, `/node_modules/${dependency}/${exports[sub].default}`);
          } else {
            updateImportMap(`${dependency}/${sub}`, `/node_modules/${dependency}/${exports[sub].default}`);
          }
        } else {
          // TODO what to do here?  what else is there besides default?
        }
      } else {
        // handle subpath exports
        if (sub === '.') {
          updateImportMap(dependency, `/node_modules/${dependency}/${exports[sub]}`);
        } else if (sub.indexOf('*') >= 0) {
          await walkExportPatterns(dependency, sub, exports[sub], resolvedRoot);
        } else {
          updateImportMap(`${dependency}/${sub}`, `/node_modules/${dependency}/${sub}`);
        }
      }
    }
  } else if (module || main) {
    updateImportMap(dependency, `/node_modules/${dependency}/${module ?? main}`);
  } else {
    // TODO warn about no exports found
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