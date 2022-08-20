import fs from 'fs';
import { hashString } from '../lib/hashing-utils.js';
import { getRollupConfig } from '../config/rollup.config.js';
import path from 'path';
import { rollup } from 'rollup';

async function cleanUpResources(compilation) {
  const { outputDir } = compilation.context;

  for (const resource of compilation.resources) {
    const { src, optimizedFileName } = resource;

    if (!src || (compilation.config.optimization === 'inline')) { //  && (compilation.config.optimization === 'inline' || rawAttributes.indexOf('data-gwd-opt="inline"') >= 0)) {

      // TODO dedupe resources
      if (fs.existsSync(path.join(outputDir, optimizedFileName))) {
        fs.unlinkSync(path.join(outputDir, optimizedFileName));
      }
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
    const { type } = resource;

    if (['style', 'link'].includes(type)) {
      const { contents, src = '' } = resource;
      const srcPath = src && src.replace(/\.\.\//g, '').replace('./', '');
      let optimizedFileName;

      if (src) {
        const basename = path.basename(srcPath);
        const basenamePieces = path.basename(srcPath).split('.');

        optimizedFileName = srcPath.replace(basename, `${basenamePieces[0]}.${hashString(contents)}.css`); // `${path.basename(srcPath)}/${hashString(path.basename(srcPath))}.css`;
      } else {
        optimizedFileName = `${hashString(contents)}.css`;
      }

      const outputPathRoot = path.join(outputDir, path.dirname(optimizedFileName));
      const optimizedStyles = await optimizationPlugins.reduce(async (contents, optimizePromise) => {
        return await optimizePromise.optimize(resource.sourcePathURL.pathname, contents);
      }, contents || undefined);

      if (!fs.existsSync(outputPathRoot)) {
        fs.mkdirSync(outputPathRoot, {
          recursive: true
        });
      }

      compilation.resources[resourceIdx].optimizedFileName = optimizedFileName;
      compilation.resources[resourceIdx].optimizedFileContents = optimizedStyles;

      await fs.promises.writeFile(path.join(outputDir, optimizedFileName), optimizedStyles);
    }
  }
}

// TODO needs to optimize too?
async function bundleScriptResources(compilation) {
  // https://rollupjs.org/guide/en/#differences-to-the-javascript-api
  const [rollupConfig] = await getRollupConfig(compilation, compilation.resources
    .filter(resource => resource.type === 'script')
    .map(resource => resource.sourcePathURL.pathname));

  if (rollupConfig.input.length !== 0) {
    const bundle = await rollup(rollupConfig);
    await bundle.write(rollupConfig.output);
  }
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