const fs = require('fs');

// defer to NodeJS to find where on disk a package is located using require.resolve
// and return the root absolute location
function getNodeModulesLocationForPackage(packageName) {
  let nodeModulesUrl;
  
  try {
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
    // require.resolve may fail in the event a package has no main in its package.json
    // so as a fallback, ask for node_modules paths and find its location manually
    // https://github.com/ProjectEvergreen/greenwood/issues/557#issuecomment-923332104
    const locations = require.resolve.paths(packageName);

    for (const location in locations) {
      const nodeModulesPackageRoot = `${locations[location]}/${packageName}`;
      const packageJsonLocation = `${nodeModulesPackageRoot}/package.json`;

      if (fs.existsSync(packageJsonLocation)) {
        nodeModulesUrl = nodeModulesPackageRoot;
      }
    }

    if (!nodeModulesUrl) {
      console.debug(`Unable to look up ${packageName} using NodeJS require.resolve.`);
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

module.exports = {
  getNodeModulesLocationForPackage,
  getPackageNameFromUrl
};