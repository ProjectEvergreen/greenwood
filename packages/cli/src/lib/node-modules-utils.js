const fs = require('fs');
const path = require('path');

// defer to NodeJS to find where on disk a package is located using require.resolve
// and return the root absolute location
function getNodeModulesResolveLocationForPackageName(packageName) {
  let nodeModulesUrl;
  
  try {
    // console.debug('require.resolve =>', packageName);
    const packageEntryLocation = require.resolve(packageName).replace(/\\/g, '/'); // force / for consistency and path matching

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
    // do a quick check to see if this is a package with _NO_ main, which has some issues for require.resolve
    // https://github.com/ProjectEvergreen/greenwood/issues/557#issuecomment-923332104
    const pathToPackageJson = `${getFallbackNodeModulesLocation(packageName)}/package.json`;

    if (fs.existsSync(pathToPackageJson)) {
      const packageJson = require(pathToPackageJson);

      // console.debug('MAIN @@@@@', packageJson.main);
      // console.debug('aaaa', !!packageJson.main);
      // console.debug('bbbb', packageJson.main !== '');
      // console.debug('cccc', !!packageJson.main && packageJson.main !== '');
      if (!!packageJson.main && packageJson.main !== '') {
        console.debug(`Unable to look up package using NodeJS require.resolve for => ${packageName}.`);
      }
    }
  }

  // console.debug('detected nodeModulesUrl @@@@', nodeModulesUrl);
  return nodeModulesUrl;
}

// for some reason if require.resolve doesnt work, assume the current directory and construct path manually
function getFallbackNodeModulesLocation(packageName) {
  const nodeModulesUrl = path.join(process.cwd(), 'node_modules', packageName);

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

module.exports = {
  getFallbackNodeModulesLocation,
  getNodeModulesResolveLocationForPackageName,
  getPackageNameFromUrl
};