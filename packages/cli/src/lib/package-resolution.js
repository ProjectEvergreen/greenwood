import fs from "node:fs";
import { findPackageJSON } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const IMPORT_MAP_RESOLVED_PREFIX = "/~";

// Normalize the lookup base to a URL, defaulting to the current working directory.
function getResolutionParent(parent = pathToFileURL(`${process.cwd()}/`)) {
  return parent instanceof URL ? parent : new URL(parent);
}

// Find a package's real directory from its manifest, including packages with no module entry point.
function getPackageRoot(specifier, parent) {
  const packageJsonPath = findPackageJSON(specifier, getResolutionParent(parent));

  if (!packageJsonPath) {
    throw new Error(`Unable to locate package.json for ${specifier}`);
  }

  return new URL("./", pathToFileURL(fs.realpathSync(packageJsonPath)));
}

// Encode a file URL as a browser resource path with Greenwood's resolved /~ prefix.
function fileUrlToResolvedPrefixPath(url) {
  const fileUrl = new URL(url);

  if (fileUrl.protocol !== "file:") {
    throw new TypeError("A resolved resource must be a file URL");
  }

  return `${IMPORT_MAP_RESOLVED_PREFIX}${fileUrl.pathname}${fileUrl.search}${fileUrl.hash}`;
}

// Rollup expects filesystem paths for absolute module imports, rather than file: URLs.
function fileUrlToModulePath(value) {
  const url = new URL(value);

  return `${fileURLToPath(url).replaceAll("\\", "/")}${url.search}${url.hash}`;
}

// Recognize /~ paths that preserve an already resolved filesystem location.
function isResolvedPrefixPath(pathname) {
  return pathname.startsWith(`${IMPORT_MAP_RESOLVED_PREFIX}/`);
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

// Decode a /~ browser resource path back to a file URL, preserving its query and fragment.
function resourcePathToFileUrl(value) {
  const url = new URL(value, "http://localhost");

  if (!isResolvedPrefixPath(url.pathname)) {
    throw new TypeError("Expected a resolved Greenwood resource URL");
  }

  return new URL(
    `file://${url.pathname.slice(IMPORT_MAP_RESOLVED_PREFIX.length)}${url.search}${url.hash}`,
  );
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

  // Ordinary resource paths are URL-relative; bare package entry resolution is deferred.
  return new URL(value, getResolutionParent(parent));
}

export {
  IMPORT_MAP_RESOLVED_PREFIX,
  fileUrlToResolvedPrefixPath,
  fileUrlToModulePath,
  getPackageRoot,
  isNodeModulesPath,
  isPackageResourcePath,
  isResolvedPrefixPath,
  resolveResourceUrl,
  resourcePathToFileUrl,
};
