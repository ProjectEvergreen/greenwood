import fs from 'fs';
import { hashString } from '../lib/hashing-utils.js';
import { getRollupConfig } from '../config/rollup.config.js';
import path from 'path';
import { rollup } from 'rollup';

async function cleanUpResources(compilation) {
  const { scratchDir, outputDir } = compilation.context;

  for (const resource of compilation.resources) {
    if (resource.contents) {
      const src = path.basename(resource.sourcePathURL.pathname);
      fs.unlinkSync(resource.sourcePathURL.pathname.replace(scratchDir, `${outputDir}/`).replace(src, resource.optimizedFileName));
    }
  }
}

async function optimizePages(compilation, optimizeResources) {
  const { scratchDir, outputDir } = compilation.context;

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

async function bundleStyleResources(compilation, optimizationPlugins) {
  const resources = compilation.resources;
  const { outputDir } = compilation.context;

  for (const resourceIdx in resources) {
    const resource = resources[resourceIdx];
    if (resource.type === 'style') {
      const srcPath = resource.src.replace(/\.\.\//g, '').replace('./', '');
      const hashPieces = path.basename(srcPath).split('.');
      const optimizedFileName = `${hashPieces[0]}.${hashString(srcPath)}.${hashPieces[1]}`;
      const optimizedStyles = await optimizationPlugins.reduce(async (contents, optimizePromise) => {
        return await optimizePromise.optimize(resource.sourcePathURL.pathname, contents);
      }, undefined);
      const outputPathRoot = srcPath.indexOf('/node_modules') === 0
        ? outputDir
        : path.join(outputDir, path.dirname(srcPath));

      if (!fs.existsSync(outputPathRoot)) {
        fs.mkdirSync(outputPathRoot, {
          recursive: true
        });
      }

      compilation.resources[resourceIdx].optimizedFileName = optimizedFileName;

      await fs.promises.writeFile(path.join(outputPathRoot, optimizedFileName), optimizedStyles);
    }
  }
}

// TODO needs to optimize too?
async function bundleScriptResources(compilation) {
  // https://rollupjs.org/guide/en/#differences-to-the-javascript-api
  const rollupConfigs = await getRollupConfig(compilation, compilation.resources
    .filter(resource => resource.type === 'script')
    .map(resource => resource.sourcePathURL.pathname));
  const bundle = await rollup(rollupConfigs[0]);

  await bundle.write(rollupConfigs[0].output);
}

const bundleCompilation = async (compilation) => {

  return new Promise(async (resolve, reject) => {
    try {
      compilation.resources = compilation.graph.map((page) => {
        return page.imports;
      }).flat();
      const optimizeResourcePlugins = compilation.config.plugins.filter((plugin) => {
        return plugin.type === 'resource';
      }).map((plugin) => {
        return plugin.provider(compilation);
      }).filter((provider) => {
        return provider.shouldOptimize && provider.optimize;
      });

      // TODO do we still need to mutate this?
      compilation.graph = compilation.graph.filter(page => !page.isSSR || (page.isSSR && page.data.static));

      console.info('optimizing pages...');

      await Promise.all([
        await bundleScriptResources(compilation),
        await bundleStyleResources(compilation, optimizeResourcePlugins.filter(plugin => plugin.contentType.includes('text/css')))
      ]);

      await optimizePages(compilation, optimizeResourcePlugins.filter(plugin => plugin.contentType.includes('text/html')));
      await cleanUpResources(compilation);

      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

export { bundleCompilation };