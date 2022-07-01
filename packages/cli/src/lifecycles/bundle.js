import { getRollupConfig } from '../config/rollup.config.js';
import { rollup } from 'rollup';

const bundleCompilation = async (compilation) => {

  return new Promise(async (resolve, reject) => {
    try {
      // https://rollupjs.org/guide/en/#differences-to-the-javascript-api
      if (compilation.graph.length > 0) {
        const rollupConfigs = await getRollupConfig({
          ...compilation,
          graph: compilation.graph.filter(page => !page.isSSR)
        });
        const bundle = await rollup(rollupConfigs[0]);

        await bundle.write(rollupConfigs[0].output);
      }

      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

export { bundleCompilation };