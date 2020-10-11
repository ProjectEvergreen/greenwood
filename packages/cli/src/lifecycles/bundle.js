const { execSync } = require('child_process');
const getRollupConfig = require('../config/rollup.config');
const rollup = require('rollup');

module.exports = bundleCompilation = async (compilation) => {

  return new Promise(async (resolve, reject) => {
    try {
      const rollupConfigs = await getRollupConfig(compilation);

      // https://rollupjs.org/guide/en/#differences-to-the-javascript-api
      const bundle = await rollup.rollup(rollupConfigs[0]);
      await bundle.write(rollupConfigs[0].output);

      resolve();
    } catch (err) {
      reject(err);
    }
  });
}