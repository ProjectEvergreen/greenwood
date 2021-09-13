// ideally let NodeJS do the look up for us, but in the evant that fails
// do our best to resolve the file (helpful for theme pack testing and development) 
// (where things are unpublished and routed around)
function getNodeModulesResolveLocationForPackageName(packageName) {
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
    console.debug(`Unable to look up package using NodeJS require.resolve for => ${packageName}`);
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
  getNodeModulesResolveLocationForPackageName,
  getPackageNameFromUrl
};