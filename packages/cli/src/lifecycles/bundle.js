import fs from 'fs';
import { getRollupConfig } from '../config/rollup.config.js';
import path from 'path';
import { rollup } from 'rollup';

async function optimizePages(compilation) {
  const { scratchDir, outputDir } = compilation.context;
  const optimizeResources = compilation.config.plugins.filter((plugin) => {
    return plugin.type === 'resource';
  }).map((plugin) => {
    return plugin.provider(compilation);
  }).filter((provider) => {
    return provider.shouldOptimize && provider.optimize;
  });

  return Promise.all(compilation.graph.map(async (page) => {
    const { route, outputPath } = page;
    const html = await fs.promises.readFile(path.join(scratchDir, outputPath), 'utf-8');

    if (route !== '/404/' && !fs.existsSync(path.join(outputDir, route))) {
      fs.mkdirSync(path.join(outputDir, route), {
        recursive: true
      });
    }

    const htmlOptimized = await optimizeResources.reduce(async (htmlPromise, resource) => {
      const contents = await htmlPromise;
      const shouldOptimize = await resource.shouldOptimize(outputPath, contents);

      return shouldOptimize
        ? resource.optimize(outputPath, contents)
        : Promise.resolve(contents);
    }, Promise.resolve(html));

    await fs.promises.writeFile(path.join(outputDir, outputPath), htmlOptimized);
  }));
}

async function bundleResources(compilation) {
  // https://rollupjs.org/guide/en/#differences-to-the-javascript-api
  const rollupConfigs = await getRollupConfig({ ...compilation });
  const bundle = await rollup(rollupConfigs[0]);

  await bundle.write(rollupConfigs[0].output);
}

const bundleCompilation = async (compilation) => {

  return new Promise(async (resolve, reject) => {
    try {
      compilation.graph = compilation.graph.filter(page => !page.isSSR || (page.isSSR && page.data.static));

      await bundleResources(compilation);
      await optimizePages(compilation);

      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

export { bundleCompilation };