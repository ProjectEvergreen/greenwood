import fs from "node:fs";
import { findPackageJSON, isBuiltin } from "node:module";
import { pathToFileURL } from "node:url";
import {
  getPackageRoot,
  fileUrlToResolvedPrefixPath,
  IMPORT_MAP_RESOLVED_PREFIX,
} from "./package-resolution.js";

// priority is from L -> R
const SUPPORTED_EXPORT_CONDITIONS = ["import", "module-sync", "default"];

// Resolve from the package scope that owns the dependency.  Finding package.json is sufficient
// here because all callers use the result to derive the package root, and it also supports packages with no main entry point.
// https://unpkg.com/browse/@types/trusted-types@2.0.7/package.json
// Compatibility helper for callers expecting the package.json URL.
function resolveBareSpecifier(
  specifier,
  parent = pathToFileURL(`${process.cwd()}/`),
  diagnostics = new Map(),
) {
  let resolvedPath;

  try {
    if (isBuiltin(specifier)) {
      return specifier;
    }

    const packageJsonPath = findPackageJSON(specifier, parent);

    resolvedPath = packageJsonPath
      ? pathToFileURL(fs.realpathSync(packageJsonPath)).href
      : undefined;
  } catch (e) {
    diagnostics.set(
      specifier,
      `ERROR (${e.code}): unable to resolve specifier => \`${specifier}\`\n${e.message}`,
    );
  }

  return resolvedPath;
}

// Find the nearest complete package manifest for a file, skipping nested type-only manifests.
function derivePackageRoot(resolved) {
  if (!resolved || !resolved.startsWith("file:")) {
    return null;
  }

  let root = new URL("./", resolved);

  while (true) {
    const packageJsonUrl = new URL("./package.json", root);

    if (fs.existsSync(packageJsonUrl)) {
      // Skip nested manifests that only declare module type (e.g. Luxon).
      const { name, version } = JSON.parse(fs.readFileSync(packageJsonUrl, "utf-8"));

      if (name && version) {
        return root.href;
      }
    }

    const parent = new URL("../", root);

    if (parent.href === root.href) {
      return null;
    }

    root = parent;
  }
}

function updateImportMap(key, value, resolvedRoot, state) {
  const { importMap, scopes, directImports, projectScope, activeScope } = state;
  const normalizedKey = key.replace("./", "").replace(/\/\//g, "/").replace(/\\/g, "/");
  const target = fileUrlToResolvedPrefixPath(
    new URL(value.startsWith(".") ? value : `./${value}`, resolvedRoot),
  );
  importMap.set(normalizedKey, target);

  if (activeScope === projectScope) {
    directImports.set(normalizedKey, target);
  } else if (activeScope) {
    if (!scopes.has(activeScope)) scopes.set(activeScope, new Map());
    scopes.get(activeScope).set(normalizedKey, target);
  }
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
async function walkExportPatterns(dependency, condition, resolvedRoot, state) {
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

    updateImportMap(`${dependency}/${subKey}`, relativePath, resolvedRoot, state);
  }
}

function trackExportConditions(dependency, exports, sub, condition, resolvedRoot, state) {
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
            state,
          );

          break;
        }
      }
    } else if (sub === ".") {
      updateImportMap(
        dependency,
        `${exports[sub][condition].default ?? exports[sub][condition]}`,
        resolvedRoot,
        state,
      );
    } else if (SUPPORTED_EXPORT_CONDITIONS.includes(sub)) {
      // for example, tslib
      // https://app.unpkg.com/tslib@2.8.1/files/package.json#L37
      updateImportMap(
        dependency,
        `${exports[sub][condition].default ?? exports[sub][condition]}`,
        resolvedRoot,
        state,
      );
    } else {
      // should this case be supported if its not a SUPPORTED_CONDITION though?
      // cant hurt to leave it in for now I suppose...
      updateImportMap(
        `${dependency}/${sub}`,
        `${exports[sub][condition].default ?? exports[sub][condition]}`,
        resolvedRoot,
        state,
      );
    }
  } else {
    // https://unpkg.com/browse/redux@5.0.1/package.json
    updateImportMap(dependency, `${exports[sub][condition]}`, resolvedRoot, state);
  }
}

// https://nodejs.org/api/packages.html#conditional-exports
async function walkPackageForExports(dependency, packageJson, resolvedRoot, state) {
  const { diagnostics } = state;
  const { exports, module, main } = packageJson;

  // favor exports over main / module
  // favor exports over main / module
  if (typeof exports === "string") {
    // https://unpkg.com/browse/robust-predicates@3.0.2/package.json
    updateImportMap(dependency, exports, resolvedRoot, state);
  } else if (exports && typeof exports === "object") {
    // we need to check for conditional exports that are null first, since typeof null === "object"
    // https://github.com/ProjectEvergreen/greenwood/issues/1704
    // https://app.unpkg.com/effect@4.0.0-beta.97/files/package.json#L52
    /*
     * test for conditional subpath exports
     * 1. import
     * 2. module-sync
     * 3. default
     */
    for (const sub in exports) {
      // although not widely used and is generally discouraged / deprecated, some export maps have an array
      // https://app.unpkg.com/@jridgewell/gen-mapping@0.3.13/files/package.json#L18
      if (Array.isArray(exports[sub])) {
        for (const item of exports[sub]) {
          if (typeof item === "string") {
            // basic support, not properly tested
            updateImportMap(`${dependency}/${item}`, item, resolvedRoot, state);
          } else if (typeof item === "object") {
            let matched = false;

            for (const condition of SUPPORTED_EXPORT_CONDITIONS) {
              if (item[condition]) {
                matched = true;
                if (sub.indexOf("*") >= 0) {
                  // basic support, not properly tested
                  await walkExportPatterns(
                    dependency,
                    sub,
                    exports[sub][condition],
                    resolvedRoot,
                    state,
                  );
                } else {
                  // could there be more sub conditions here?  Going with default for now
                  updateImportMap(
                    dependency,
                    item[condition].default ?? item[condition],
                    resolvedRoot,
                    state,
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
      } else if (exports[sub] && typeof exports[sub] === "object") {
        // we need to check for conditional exports that are null first, since typeof null === "object"
        // https://github.com/ProjectEvergreen/greenwood/issues/1704
        // https://app.unpkg.com/effect@4.0.0-beta.97/files/package.json#L52
        let matched = false;

        for (const condition of SUPPORTED_EXPORT_CONDITIONS) {
          if (exports[sub][condition]) {
            matched = true;
            if (sub.indexOf("*") >= 0) {
              await walkExportPatterns(dependency, exports[sub][condition], resolvedRoot, state);
            } else {
              trackExportConditions(dependency, exports, sub, condition, resolvedRoot, state);
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
          updateImportMap(dependency, `${exports[sub]}`, resolvedRoot, state);
        } else if (exports[sub] && sub.indexOf("*") >= 0) {
          // we need to check for conditional export sub conditions that are null first
          // https://github.com/ProjectEvergreen/greenwood/issues/1704
          // https://app.unpkg.com/effect@4.0.0-beta.97/files/package.json#L52
          await walkExportPatterns(dependency, exports[sub], resolvedRoot, state);
        } else if (SUPPORTED_EXPORT_CONDITIONS.includes(sub)) {
          // filter out for just supported top level conditions
          // https://unpkg.com/browse/d3@7.9.0/package.json
          updateImportMap(dependency, `${exports[sub]}`, resolvedRoot, state);

          // make sure we bail out so a later condition (e.g. default) does not overwrite an earlier one (e.g. import)
          // https://app.unpkg.com/@beforesemicolon/markup@1.14.1/files/package.json#L10
          break;
        } else {
          // let all other conditions "pass through" as is
          updateImportMap(`${dependency}/${sub}`, `${exports[sub]}`, resolvedRoot, state);
        }
      }
    }
  } else if (module) {
    updateImportMap(dependency, module, resolvedRoot, state);
  } else if (main) {
    // support packages that assume "deep" main imports
    // https://github.com/ProjectEvergreen/greenwood/issues/1602
    const root = main.split("/").slice(0, -1).join("/");

    updateImportMap(dependency, main, resolvedRoot, state);
    await walkExportPatterns(dependency, `${root}/*`, resolvedRoot, state);
  } else if (fs.existsSync(new URL("./index.js", resolvedRoot))) {
    // if an index.js file exists but with no main entry point, then it should count as a main entry point
    // https://docs.npmjs.com/cli/v7/configuring-npm/package-json#main
    // https://unpkg.com/browse/object-assign@4.1.1/package.json
    updateImportMap(dependency, "index.js", resolvedRoot, state);
  } else {
    // ex: https://unpkg.com/browse/uuid@3.4.0/package.json
    diagnostics.set(
      dependency,
      `WARNING: No supported entry point detected for => \`${dependency}\``,
    );
  }
}

// we recursively cache / memoize walkedPackages to account for scenarios where Greenwood can (pre)render concurrently
async function walkPackageDependencies(packageJson, walkedPackages, parent, state) {
  const { diagnostics } = state;
  try {
    const dependencies = Object.keys(packageJson.dependencies || {});

    for (const dependency of dependencies) {
      const resolved = resolveBareSpecifier(dependency, parent, diagnostics);

      if (resolved) {
        const resolvedRoot = isBuiltin(resolved) ? null : getPackageRoot(dependency, parent).href;

        if (resolvedRoot) {
          const resolvedPackageJson =
            // @ts-expect-error see https://github.com/microsoft/TypeScript/issues/42866
            (await import(new URL("./package.json", resolvedRoot), { with: { type: "json" } }))
              .default;

          state.activeScope = fileUrlToResolvedPrefixPath(new URL("./", parent));
          await walkPackageForExports(dependency, resolvedPackageJson, resolvedRoot, state);
          state.activeScope = undefined;

          if (!walkedPackages.has(resolvedRoot)) {
            walkedPackages.add(resolvedRoot);

            await walkPackageDependencies(resolvedPackageJson, walkedPackages, resolved, state);
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
}

async function walkPackageJson(
  packageJson = {},
  walkedPackages = new Set(),
  parent = pathToFileURL(`${process.cwd()}/`),
) {
  const state = {
    importMap: new Map(),
    diagnostics: new Map(),
    scopes: new Map(),
    directImports: new Map(),
    projectScope: fileUrlToResolvedPrefixPath(new URL("./", parent)),
    activeScope: undefined,
  };
  await walkPackageDependencies(packageJson, walkedPackages, parent, state);
  const { importMap, directImports, scopes, diagnostics } = state;
  const resolvedImports = new Map([...importMap, ...directImports]);
  const scopedOverrides = {};

  for (const [scope, entries] of scopes) {
    const overrides = Object.fromEntries(
      [...entries].filter(([key, target]) => resolvedImports.get(key) !== target),
    );

    if (Object.keys(overrides).length > 0) scopedOverrides[scope] = overrides;
  }

  return { importMap: resolvedImports, diagnostics, scopes: scopedOverrides };
}

export { walkPackageJson, resolveBareSpecifier, derivePackageRoot, IMPORT_MAP_RESOLVED_PREFIX };
