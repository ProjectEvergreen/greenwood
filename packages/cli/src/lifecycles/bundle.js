const { execSync } = require('child_process');

module.exports = bundleCompilation = async (compilation) => {

  return new Promise(async (resolve, reject) => {
    try {

      // TODO use rollup API directly and use compilation
      // TODO the above requires NodeJS 14.x w/ ESM support?
      execSync('rollup -c ./packages/cli/src/config/rollup.config.js');

      resolve();
    } catch (err) {
      reject(err);
    }
  });
}