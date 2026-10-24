import {
  checkResourceExists,
  isResolvedPrefixPath,
  resourcePathToFileUrl,
} from "./resource-utils.js";
import fs from "node:fs/promises";
import { realpathSync } from "node:fs";
import { findPackageJSON } from "node:module";
import { pathToFileURL } from "node:url";
import { parse } from "node-html-parser";
import { resolve } from "./vendor/import-meta-resolve.js";

// Find a package's real directory from its manifest, including packages with no module entry point.
// The caller supplies the URL of the project or module that owns the dependency.
function getPackageRoot(specifier, parent) {
  const packageJsonPath = findPackageJSON(specifier, new URL(parent));

  if (!packageJsonPath) {
    throw new Error(`Unable to locate package.json for ${specifier}`);
  }

  return new URL("./", pathToFileURL(realpathSync(packageJsonPath)));
}

// Resolved filesystem paths may contain node_modules at any depth; normalize Windows separators.
function isNodeModulesPath(pathname) {
  return pathname.replaceAll("\\", "/").includes("/node_modules/");
}

// Browser shortcuts must start with /node_modules/ or /~; nested node_modules segments are ordinary paths.
// A /~ path can also point to a linked package outside node_modules.
function isPackageResourcePath(pathname) {
  return pathname.startsWith("/node_modules/") || isResolvedPrefixPath(pathname);
}

// Decode /~ paths, locate /node_modules/ assets from the caller's context, or resolve relative URLs.
function resolveResourceUrl(value, parent) {
  const url = new URL(value, "http://localhost");

  if (isResolvedPrefixPath(url.pathname)) {
    return resourcePathToFileUrl(url);
  }

  if (url.pathname.startsWith("/node_modules/")) {
    const segments = url.pathname.slice("/node_modules/".length).split("/");
    const packageSegments = segments[0].startsWith("@") ? 2 : 1;
    const specifier = segments.slice(0, packageSegments).join("/");
    const root = getPackageRoot(specifier, parent);

    return new URL(`./${segments.slice(packageSegments).join("/")}${url.search}${url.hash}`, root);
  }

  return new URL(resolve(value, parent));
}

// Resolve the public /node_modules/ shortcut from the project, regardless of install layout.
function getResolvedHrefFromPathnameShortcut(pathname, parent) {
  try {
    return resolveResourceUrl(pathname, parent).href;
  } catch {
    // Preserve the fallback for local theme pack development.
    return new URL(`.${pathname}`, parent);
  }
}

async function getPackageJsonForProject({ userWorkspace, projectDirectory }) {
  for (const directory of [userWorkspace, projectDirectory]) {
    const packageJsonUrl = new URL("./package.json", directory);

    if (await checkResourceExists(packageJsonUrl)) {
      return {
        packageJson: JSON.parse(await fs.readFile(packageJsonUrl, "utf-8")),
        packageJsonUrl,
      };
    }
  }

  return { packageJson: {}, packageJsonUrl: new URL("./package.json", projectDirectory) };
}

const IMPORT_MAP_SELECTOR = 'head > script[type="importmap"], head > script[type="importmap-shim"]';

function getImportMap(html = "") {
  const script = parse(html).querySelector(IMPORT_MAP_SELECTOR);

  return script ? JSON.parse(script.textContent) : { imports: {} };
}

function mergeImportMap(html = "", { imports = {}, scopes = {} } = {}, shouldShim = false) {
  if (Object.keys(imports).length === 0 && Object.keys(scopes).length === 0) {
    return html;
  }

  const root = parse(html);
  const script = root.querySelector(IMPORT_MAP_SELECTOR);
  const existing = script ? JSON.parse(script.textContent) : {};
  const mergedScopes = { ...scopes, ...existing.scopes };

  for (const scope of Object.keys(scopes)) {
    mergedScopes[scope] = { ...scopes[scope], ...existing.scopes?.[scope] };
  }

  const merged = { ...existing, imports: { ...imports, ...existing.imports } };

  if (Object.keys(mergedScopes).length > 0) {
    merged.scopes = mergedScopes;
  }

  const contents = JSON.stringify(merged, null, 2);

  if (script) {
    script.set_content(contents);
    script.setAttribute("type", shouldShim ? "importmap-shim" : "importmap");
  } else {
    root
      .querySelector("head")
      ?.prepend(
        `<script type="${shouldShim ? "importmap-shim" : "importmap"}">${contents}</script>`,
      );
  }

  return root.toString();
}

// Both Lit hydration and JSX Signals must follow the map and precede user module scripts.
function insertAfterImportMap(html, scriptContents) {
  const root = parse(html);
  const script = root.querySelector(IMPORT_MAP_SELECTOR);

  if (script) {
    script.after(scriptContents);
  } else {
    root.querySelector("head")?.prepend(scriptContents);
  }

  return root.toString();
}

export {
  getPackageRoot,
  isNodeModulesPath,
  resolveResourceUrl,
  getImportMap,
  getPackageJsonForProject,
  getResolvedHrefFromPathnameShortcut,
  insertAfterImportMap,
  isPackageResourcePath,
  mergeImportMap,
};
