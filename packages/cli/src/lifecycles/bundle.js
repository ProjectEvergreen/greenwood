const getRollupConfig = require('../config/rollup.config');
const rollup = require('rollup');

module.exports = bundleCompilation = async (compilation) => {

  return new Promise(async (resolve, reject) => {
    try {
      // https://rollupjs.org/guide/en/#differences-to-the-javascript-api

      if (compilation.graph.length > 0) {
        const rollupConfigs = await getRollupConfig(compilation);
        const bundle = await rollup.rollup(rollupConfigs[0]);

        await bundle.write(rollupConfigs[0].output);
      }

      resolve();
    } catch (err) {
      reject(err);
    }
  });
};