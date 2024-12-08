import { checkResourceExists } from './resource-utils.js';
import { resolveBareSpecifier, derivePackageRoot } from './walker-package-ranger.js';
import fs from 'fs/promises';

// take a "shortcut" pathname, e.g. /node_modules/lit/lit-html.js
// and resolve it using import.meta.resolve
function getResolvedHrefFromPathnameShortcut(pathname) {
  const segments = pathname.replace('/node_modules/', '').split('/');
  const hasScope = segments[0].startsWith('@');
  const specifier = hasScope ? `${segments[0]}/${segments[1]}` : segments[0];
  const resolved = resolveBareSpecifier(specifier);

  if (resolved) {
    const root = derivePackageRoot(resolved);

    return `${root}${segments.slice(hasScope ? 2 : 1).join('/')}`;
  } else {
    // for example, local theme pack development
    return `file://${pathname}`;
  }
}

async function getPackageJsonForProject({ userWorkspace, projectDirectory }) {
  const monorepoPackageJsonUrl = new URL('./package.json', userWorkspace);
  const topLevelPackageJsonUrl = new URL('./package.json', projectDirectory);
  const hasMonorepoPackageJson = await checkResourceExists(monorepoPackageJsonUrl);
  const hasTopLevelPackageJson = await checkResourceExists(topLevelPackageJsonUrl);

  return hasMonorepoPackageJson // handle monorepos first
    ? JSON.parse(await fs.readFile(monorepoPackageJsonUrl, 'utf-8'))
    : hasTopLevelPackageJson
      ? JSON.parse(await fs.readFile(topLevelPackageJsonUrl, 'utf-8'))
      : {};
}

export {
  getPackageJsonForProject,
  getResolvedHrefFromPathnameShortcut
};