import fs from "node:fs";
import { isBuiltin } from "node:module";

// priority if from L -> R
const SUPPORTED_EXPORT_CONDITIONS = ["import", "module-sync", "default"];
const IMPORT_MAP_RESOLVED_PREFIX = "/~";
const importMap = new Map();
const diagnostics = new Map();

function updateImportMap(key, value, resolvedRoot) {
  importMap.set(
    key.replace("./", "").replace(/\/\//g, "/").replace(/\\/g, "/"),
    `${IMPORT_MAP_RESOLVED_PREFIX}${resolvedRoot.replace("file://", "")}${value.replace("./", "")}`,
  );
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
    diagnostics.set(
      specifier,
      `ERROR (${e.code}): unable to resolve specifier => \`${specifier}\`\n${e.message}`,
    );
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
    .replace("file://", "")
    .split("/")
    .filter((segment) => segment !== "")
    .reverse();
  let root = resolved.replace(segments[0], "");

  for (const segment of segments.slice(1)) {
    if (fs.existsSync(new URL("./package.json", root))) {
      // we have to check that this package.json actually has as a name AND version
      // https://github.com/moment/luxon/issues/1543#issuecomment-2546858540
      // https://github.com/ProjectEvergreen/greenwood/issues/1349
      const resolvedPackageJson = JSON.parse(
        fs.readFileSync(new URL("./package.json", root), "utf-8"),
      );
      const { name, version } = resolvedPackageJson;

      if (name && version) {
        break;
      }
    }

    // make sure we are trimming from the end
    // https://github.com/ProjectEvergreen/greenwood/issues/1386
    root = root.substring(0, root.lastIndexOf(segment));
  }

  return root !== "" ? root : null;
}

/*
 * https://nodejs.org/api/packages.html#subpath-patterns
 *
 * Examples
 * "./icons/*": "./icons/*" - https://unpkg.com/browse/@spectrum-web-components/icons-workflow@1.0.1/package.json
 * "./components/*": "./dist/components/*.js" - https://unpkg.com/browse/@uswds/web-components@0.0.1-alpha/package.json
 * "./src/components/*": "./src/components/* /index.js - https://unpkg.com/browse/@uswds/web-components@0.0.1-alpha/package.json
 *  "./*": { "default": "./dist/*.ts.js" } - https://unpkg.com/browse/signal-utils@0.21.1/package.json
 */
async function walkExportPatterns(dependency, condition, resolvedRoot) {
  // automatically deep glob, e.g. **
  // https://app.unpkg.com/@shoelace-style/shoelace@2.20.1/files/package.json#L24
  // https://app.unpkg.com/three@0.180.0/files/package.json
  const needle = condition.endsWith("/*") ? `${condition}*` : condition;
  const matches = fs.promises.glob(needle.startsWith("/") ? needle.replace("/", "") : needle, {
    cwd: new URL(resolvedRoot),
  });

  for await (const match of matches) {
    const filePathUrl = new URL(`./${match}`, resolvedRoot);
    const relativePath = filePathUrl.href.replace(resolvedRoot, "");
    // trim matches that are just a .
    // https://app.unpkg.com/tslib@2.8.1/files/package.json#L45
    const subKey = match === "." ? "" : match;

    updateImportMap(`${dependency}/${subKey}`, relativePath, resolvedRoot);
  }
}

function trackExportConditions(dependency, exports, sub, condition, resolvedRoot) {
  if (typeof exports[sub] === "object") {
    // also check for nested conditions of conditions, default to default for now
    // https://unpkg.com/browse/@floating-ui/dom@1.6.12/package.json
    if (typeof exports[sub][condition] === "object") {
      for (const subCondition in exports[sub][condition]) {
        if (SUPPORTED_EXPORT_CONDITIONS.includes(subCondition)) {
          const segment = sub === "." ? "" : `/${sub}`;

          // would this ever need to be recursive?
          updateImportMap(
            `${dependency}${segment}`,
            `${exports[sub][condition][subCondition].default ?? exports[sub][condition][subCondition]}`,
            resolvedRoot,
          );

          break;
        }
      }
    } else if (sub === ".") {
      updateImportMap(
        dependency,
        `${exports[sub][condition].default ?? exports[sub][condition]}`,
        resolvedRoot,
      );
    } else if (SUPPORTED_EXPORT_CONDITIONS.includes(sub)) {
      // for example, tslib
      // https://app.unpkg.com/tslib@2.8.1/files/package.json#L37
      updateImportMap(
        dependency,
        `${exports[sub][condition].default ?? exports[sub][condition]}`,
        resolvedRoot,
      );
    } else {
      // should this case be supported if its not a SUPPORTED_CONDITION though?
      // cant hurt to leave it in for now I suppose...
      updateImportMap(
        `${dependency}/${sub}`,
        `${exports[sub][condition].default ?? exports[sub][condition]}`,
        resolvedRoot,
      );
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
  // favor exports over main / module
  if (typeof exports === "string") {
    // https://unpkg.com/browse/robust-predicates@3.0.2/package.json
    updateImportMap(dependency, exports, resolvedRoot);
  } else if (typeof exports === "object") {
    /*
     * test for conditional subpath exports
     * 1. import
     * 2. module-sync
     * 3. default
     */
    for (const sub in exports) {
      // although not widely used and is generally discouraged / deprecated
      // some export maps have an array
      // https://app.unpkg.com/@jridgewell/gen-mapping@0.3.13/files/package.json#L18
      if (Array.isArray(exports[sub])) {
        for (const item of exports[sub]) {
          if (typeof item === "string") {
            // basic support, not properly tested
            updateImportMap(`${dependency}/${item}`, item, resolvedRoot);
          } else if (typeof item === "object") {
            let matched = false;

            for (const condition of SUPPORTED_EXPORT_CONDITIONS) {
              if (item[condition]) {
                matched = true;
                if (sub.indexOf("*") >= 0) {
                  // basic support, not properly tested
                  await walkExportPatterns(dependency, sub, exports[sub][condition], resolvedRoot);
                } else {
                  // could there be more sub conditions here?  Going with default for now
                  updateImportMap(
                    dependency,
                    item[condition].default ?? item[condition],
                    resolvedRoot,
                  );
                }
                break;
              }
            }

            if (!matched) {
              // ex. https://unpkg.com/browse/matches-selector@1.2.0/package.json
              diagnostics.set(
                dependency,
                `no supported export conditions (\`${SUPPORTED_EXPORT_CONDITIONS.join(", ")}\`) for dependency => \`${dependency}\``,
              );
            }
          }
        }
      } else if (typeof exports[sub] === "object") {
        let matched = false;

        for (const condition of SUPPORTED_EXPORT_CONDITIONS) {
          if (exports[sub][condition]) {
            matched = true;
            if (sub.indexOf("*") >= 0) {
              await walkExportPatterns(dependency, exports[sub][condition], resolvedRoot);
            } else {
              trackExportConditions(dependency, exports, sub, condition, resolvedRoot);
            }
            break;
          }
        }

        if (!matched) {
          // ex. https://unpkg.com/browse/matches-selector@1.2.0/package.json
          diagnostics.set(
            dependency,
            `no supported export conditions (\`${SUPPORTED_EXPORT_CONDITIONS.join(", ")}\`) for dependency => \`${dependency}\``,
          );
        }
      } else {
        // handle (unconditional) subpath exports
        if (sub === ".") {
          updateImportMap(dependency, `${exports[sub]}`, resolvedRoot);
        } else if (sub.indexOf("*") >= 0) {
          await walkExportPatterns(dependency, exports[sub], resolvedRoot);
        } else if (SUPPORTED_EXPORT_CONDITIONS.includes(sub)) {
          // filter out for just supported top level conditions
          // https://unpkg.com/browse/d3@7.9.0/package.json
          updateImportMap(dependency, `${exports[sub]}`, resolvedRoot);

          // make sure we bail out so a later condition (e.g. default) does not overwrite an earlier one (e.g. import)
          // https://app.unpkg.com/@beforesemicolon/markup@1.14.1/files/package.json#L10
          break;
        } else {
          // let all other conditions "pass through" as is
          updateImportMap(`${dependency}/${sub}`, `${exports[sub]}`, resolvedRoot);
        }
      }
    }
  } else if (module || main) {
    updateImportMap(dependency, `${module ?? main}`, resolvedRoot);
  } else if (fs.existsSync(new URL("./index.js", resolvedRoot))) {
    // if an index.js file exists but with no main entry point, then it should count as a main entry point
    // https://docs.npmjs.com/cli/v7/configuring-npm/package-json#main
    // https://unpkg.com/browse/object-assign@4.1.1/package.json
    updateImportMap(dependency, "index.js", resolvedRoot);
  } else {
    // ex: https://unpkg.com/browse/uuid@3.4.0/package.json
    diagnostics.set(
      dependency,
      `WARNING: No supported entry point detected for => \`${dependency}\``,
    );
  }
}

// we recursively cache / memoize walkedPackages to account for scenarios where Greenwood can (pre)render concurrently
async function walkPackageJson(packageJson = {}, walkedPackages = new Set()) {
  try {
    const dependencies = Object.keys(packageJson.dependencies || {});

    for (const dependency of dependencies) {
      const resolved = resolveBareSpecifier(dependency);

      if (resolved) {
        const resolvedRoot = derivePackageRoot(resolved);

        if (resolvedRoot) {
          const resolvedPackageJson =
            // @ts-expect-error see https://github.com/microsoft/TypeScript/issues/42866
            (await import(new URL("./package.json", resolvedRoot), { with: { type: "json" } }))
              .default;
          const { name } = resolvedPackageJson;

          await walkPackageForExports(dependency, resolvedPackageJson, resolvedRoot);

          if (!walkedPackages.has(name)) {
            walkedPackages.add(name);

            await walkPackageJson(resolvedPackageJson, walkedPackages);
          }
        } else {
          // ignore built-ins since NodeJS resolves them automatically
          // https://github.com/nodejs/node/issues/56652
          // https://nodejs.org/api/modules.html#built-in-modules
          if (!isBuiltin(resolved)) {
            diagnostics.set(
              dependency,
              `WARNING: No package.json resolved for => \`${dependency}\`, resolved to \`${resolved}\``,
            );
          }
        }
      }
    }
  } catch (e) {
    console.error("Error building up import map", e);
  }

  return { importMap, diagnostics };
}

export { walkPackageJson, resolveBareSpecifier, derivePackageRoot, IMPORT_MAP_RESOLVED_PREFIX };
