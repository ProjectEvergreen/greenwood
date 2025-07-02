import { checkResourceExists } from "./resource-utils.js";
import { resolveBareSpecifier, derivePackageRoot } from "./walker-package-ranger.js";
import fs from "node:fs/promises";

// take a "shortcut" pathname, e.g. /node_modules/lit/lit-html.js
// and resolve it using import.meta.resolve
function getResolvedHrefFromPathnameShortcut(pathname, rootFallbackUrl) {
  const segments = pathname.replace("/node_modules/", "").split("/");
  const hasScope = segments[0].startsWith("@");
  const specifier = hasScope ? `${segments[0]}/${segments[1]}` : segments[0];
  const resolved = resolveBareSpecifier(specifier);

  if (resolved) {
    const root = derivePackageRoot(resolved);

    return `${root}${segments.slice(hasScope ? 2 : 1).join("/")}`;
  } else {
    // best guess fallback, for example for local theme pack development
    return new URL(`.${pathname}`, rootFallbackUrl);
  }
}

async function getPackageJsonForProject({ userWorkspace, projectDirectory }) {
  const monorepoPackageJsonUrl = new URL("./package.json", userWorkspace);
  const topLevelPackageJsonUrl = new URL("./package.json", projectDirectory);
  const hasMonorepoPackageJson = await checkResourceExists(monorepoPackageJsonUrl);
  const hasTopLevelPackageJson = await checkResourceExists(topLevelPackageJsonUrl);

  return hasMonorepoPackageJson // handle monorepos first
    ? JSON.parse(await fs.readFile(monorepoPackageJsonUrl, "utf-8"))
    : hasTopLevelPackageJson
      ? JSON.parse(await fs.readFile(topLevelPackageJsonUrl, "utf-8"))
      : {};
}

function mergeImportMap(html = "", map = {}, shouldShim = false) {
  const importMapType = shouldShim ? "importmap-shim" : "importmap";
  const hasImportMap = html.indexOf(`script type="${importMapType}"`) > 0;
  const danglingComma = hasImportMap ? "," : "";
  const importMap = JSON.stringify(map, null, 2).replace("}", "").replace("{", "");

  if (Object.entries(map).length === 0) {
    return html;
  }

  if (hasImportMap) {
    return html.replace(
      '"imports": {',
      `
      "imports": {
        ${importMap}${danglingComma}
    `,
    );
  } else {
    return html.replace(
      "<head>",
      `
      <head>
      <script type="${importMapType}">
        {
          "imports": {
            ${importMap}
          }
        }
      </script>
    `,
    );
  }
}

export { getPackageJsonForProject, getResolvedHrefFromPathnameShortcut, mergeImportMap };
