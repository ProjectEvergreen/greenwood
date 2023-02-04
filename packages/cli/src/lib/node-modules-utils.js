// TODO convert this to use / return URLs
import { createRequire } from 'module'; // https://stackoverflow.com/a/62499498/417806
import { checkResourceExists } from '../lib/resource-utils.js';
import fs from 'fs/promises';

// defer to NodeJS to find where on disk a package is located using import.meta.resolve
// and return the root absolute location
async function getNodeModulesLocationForPackage(packageName) {
  let nodeModulesUrl;
  
  try {
    const packageEntryLocation = (await import.meta.resolve(packageName)).replace(/\\/g, '/'); // force / for consistency and path matching

    if (packageName.indexOf('@greenwood') === 0) {
      const subPackage = packageEntryLocation.indexOf('@greenwood') > 0
        ? packageName // we are in the user's node modules
        : packageName.split('/')[1]; // else we are in our monorepo
      const packageRootPath = packageEntryLocation.indexOf('@greenwood') > 0
        ? packageEntryLocation.split(packageName)[0] // we are in the user's node modules
        : packageEntryLocation.split(subPackage)[0]; // else we are in our monorepo

      nodeModulesUrl = `${packageRootPath}${subPackage}`;
    } else {
      const packageRootPath = packageEntryLocation.split(packageName)[0];

      nodeModulesUrl = `${packageRootPath}${packageName}`;
    }
  } catch (e) {
    // require.resolve may fail in the event a package has no main in its package.json
    // so as a fallback, ask for node_modules paths and find its location manually
    // https://github.com/ProjectEvergreen/greenwood/issues/557#issuecomment-923332104
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
  }

  return nodeModulesUrl;
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

async function getPackageJson({ userWorkspace, projectDirectory }) {
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
  getNodeModulesLocationForPackage,
  getPackageJson,
  getPackageNameFromUrl
};