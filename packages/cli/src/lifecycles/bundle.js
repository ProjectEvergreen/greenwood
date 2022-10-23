import { getRollupConfig } from '../config/rollup.config.js';
import { rollup } from 'rollup';

const bundleCompilation = async (compilation) => {

  return new Promise(async (resolve, reject) => {
    try {
      compilation.graph = compilation.graph.filter(page => !page.isSSR || (page.isSSR && page.data.static) || (page.isSSR && compilation.config.prerender));

      // https://rollupjs.org/guide/en/#differences-to-the-javascript-api
      if (compilation.graph.length > 0) {
        const rollupConfigs = await getRollupConfig({
          ...compilation
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