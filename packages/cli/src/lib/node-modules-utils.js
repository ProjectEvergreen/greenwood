import { createRequire } from 'module';
import { checkResourceExists } from './resource-utils.js';
import fs from 'fs/promises';

// TODO delete me
async function getNodeModulesLocationForPackage(packageName) {
  let nodeModulesUrl;

  // require.resolve may fail in the event a package has no main in its package.json
  // so as a fallback, ask for node_modules paths and find its location manually
  // https://github.com/ProjectEvergreen/greenwood/issues/557#issuecomment-923332104
  // // https://stackoverflow.com/a/62499498/417806
  const require = createRequire(import.meta.url);
  const locations = require.resolve.paths(packageName);

  for (const location in locations) {
    const nodeModulesPackageRoot = `${locations[location]}/${packageName}`;
    const packageJsonLocation = `${nodeModulesPackageRoot}/package.json`;

    if (await checkResourceExists(new URL(`file://${packageJsonLocation}`))) {
      nodeModulesUrl = nodeModulesPackageRoot;
    }
  }

  if (!nodeModulesUrl) {
    console.debug(`Unable to look up ${packageName} using NodeJS require.resolve.  Falling back to process.cwd()`);
    nodeModulesUrl = new URL(`./node_modules/${packageName}`, `file://${process.cwd()}`).pathname;
  }

  return nodeModulesUrl;
}

function resolveBareSpecifier(specifier) {
  let resolvedPath;

  // sometimes a package.json has no main field :/
  // https://unpkg.com/browse/@types/trusted-types@2.0.7/package.json
  try {
    resolvedPath = import.meta.resolve(specifier);
  } catch (e) {
    // TODO console.log(`WARNING: unable to resolve specifier \`${specifier}\``);
  }

  return resolvedPath;
}

function resolveRootForSpecifier(specifier) {
  const resolved = resolveBareSpecifier(specifier);

  if (resolved) {
    return `${resolved.split(specifier)[0]}${specifier}/`;
  }
}

// extract the package name from a URL like /node_modules/<some>/<package>/index.js
function getPackageNameFromUrl(url) {
  const packagePathPieces = url.split('node_modules/')[1].split('/'); // double split to handle node_modules within nested paths
  let packageName = packagePathPieces.shift();

  // handle scoped packages
  if (packageName.indexOf('@') === 0) {
    packageName = `${packageName}/${packagePathPieces.shift()}`;
  }

  return packageName;
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
  resolveBareSpecifier,
  resolveRootForSpecifier,
  getPackageJsonForProject,
  getNodeModulesLocationForPackage,
  getPackageNameFromUrl
};