import { checkResourceExists } from "./resource-utils.js";
import { isPackageResourcePath, resolveResourceUrl } from "./package-resolution.js";
import fs from "node:fs/promises";
import { parse } from "node-html-parser";

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
  getImportMap,
  getPackageJsonForProject,
  getResolvedHrefFromPathnameShortcut,
  insertAfterImportMap,
  isPackageResourcePath,
  mergeImportMap,
};
