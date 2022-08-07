import fs from 'fs';
import { hashString } from '../lib/hashing-utils.js';
import { getRollupConfig } from '../config/rollup.config.js';
import path from 'path';
import { rollup } from 'rollup';

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

async function bundleStyleResources(compilation, resources, optimizationPlugins) {
  const styleResources = resources.filter(resource => resource.type === 'style');
  const { outputDir } = compilation.context;

  for (const resource of styleResources) {
    const outputPath = resource.sourcePath.replace(/\.\.\//g, '').replace('./', '');
    const root = path.join(outputDir, path.dirname(outputPath));
    const hashPieces = path.basename(outputPath).split('.');
    const optimizedStyles = await optimizationPlugins.reduce(async (contents, optimizePromise) => {
      return await optimizePromise.optimize(resource.workspaceURL.pathname, contents);
    }, undefined);

    if (!fs.existsSync(root)) {
      fs.mkdirSync(root, {
        recursive: true
      });
    }

    // for (const idx in compilation.graph) {
    //   const page = compilation.graph[idx];
    //   const resources = page.imports;

    //   for (const resourceIdx in resources) {
    //     for (const bundle in bundles) {
    //       if (resources[resourceIdx].workspaceURL.pathname === bundles[bundle].facadeModuleId) {
    //         compilation.graph[idx].imports[resourceIdx].optimizedFileName = bundles[bundle].fileName;
    //       }
    //     }
    //   }
    // }

    await fs.promises.writeFile(path.join(root, `${hashPieces[0]}.${hashString(outputPath)}.${hashPieces[1]}`), optimizedStyles);
  }
}

// TODO needs to optimize too?
async function bundleScriptResources(compilation, resources) {
  // https://rollupjs.org/guide/en/#differences-to-the-javascript-api
  const rollupConfigs = await getRollupConfig(compilation, resources
    .filter(resource => resource.type === 'script')
    .map(resource => resource.workspaceURL.pathname));
  const bundle = await rollup(rollupConfigs[0]);

  await bundle.write(rollupConfigs[0].output);
}

const bundleCompilation = async (compilation) => {

  return new Promise(async (resolve, reject) => {
    try {
      const resources = compilation.graph.map((page) => {
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
        bundleScriptResources(compilation, resources),
        bundleStyleResources(compilation, resources, optimizeResourcePlugins.filter(plugin => plugin.contentType.includes('text/css')))
      ]);

      await optimizePages(compilation, optimizeResourcePlugins.filter(plugin => plugin.contentType.includes('text/html')));

      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

export { bundleCompilation };