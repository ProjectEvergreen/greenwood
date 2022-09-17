import fs from 'fs';
import { getRollupConfig } from '../config/rollup.config.js';
import { hashString } from '../lib/hashing-utils.js';
import path from 'path';
import { rollup } from 'rollup';

async function cleanUpResources(compilation) {
  const { outputDir } = compilation.context;

  for (const resource of compilation.resources.values()) {
    const { src, optimizedFileName, optimizationAttr } = resource;
    const optConfig = ['inline', 'static'].indexOf(compilation.config.optimization) >= 0;
    const optAttr = ['inline', 'static'].indexOf(optimizationAttr) >= 0;

    // TODO why wouldn't optimizedFileName exist - happens with static router.js
    if (optimizedFileName && (!src || (optAttr || optConfig))) {
      fs.unlinkSync(path.join(outputDir, optimizedFileName));
    }
  }
}

async function optimizeStaticPages(compilation, optimizeResources) {
  const { scratchDir, outputDir } = compilation.context;

  return Promise.all(compilation.graph
    .filter(page => !page.isSSR || (page.isSSR && page.data.static))
    .map(async (page) => {
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
    })
  );
}

async function bundleStyleResources(compilation, optimizationPlugins) {
  const { outputDir } = compilation.context;

  for (const resource of compilation.resources.values()) {
    const { contents, optimizationAttr, src = '', type } = resource;

    if (['style', 'link'].includes(type)) {
      const resourceKey = resource.sourcePathURL.pathname;
      const srcPath = src && src.replace(/\.\.\//g, '').replace('./', '');
      let optimizedFileName;
      let optimizedFileContents;

      if (src) {
        const basename = path.basename(srcPath);
        const basenamePieces = path.basename(srcPath).split('.');

        optimizedFileName = srcPath.indexOf('/node_modules') >= 0
          ? `${basenamePieces[0]}.${hashString(contents)}.css`
          : srcPath.replace(basename, `${basenamePieces[0]}.${hashString(contents)}.css`);
      } else {
        optimizedFileName = `${hashString(contents)}.css`;
      }

      const outputPathRoot = path.join(outputDir, path.dirname(optimizedFileName));

      if (!fs.existsSync(outputPathRoot)) {
        fs.mkdirSync(outputPathRoot, {
          recursive: true
        });
      }

      if (compilation.config.optimization === 'none' || optimizationAttr === 'none') {
        optimizedFileContents = contents;
      } else {
        const url = resource.sourcePathURL.pathname;
        let optimizedStyles = await fs.promises.readFile(url, 'utf-8');

        for (const plugin of optimizationPlugins) {
          optimizedStyles = await plugin.shouldOptimize(url, optimizedStyles)
            ? await plugin.optimize(url, optimizedStyles)
            : optimizedStyles;
        }

        optimizedFileContents = optimizedStyles;
      }

      compilation.resources.set(resourceKey, {
        ...compilation.resources.get(resourceKey),
        optimizedFileName,
        optimizedFileContents
      });

      await fs.promises.writeFile(path.join(outputDir, optimizedFileName), optimizedFileContents);
    }
  }
}

async function bundleScriptResources(compilation) {
  // https://rollupjs.org/guide/en/#differences-to-the-javascript-api
  const [rollupConfig] = await getRollupConfig(compilation);

  if (rollupConfig.input.length !== 0) {
    const bundle = await rollup(rollupConfig);
    await bundle.write(rollupConfig.output);
  }
}

const bundleCompilation = async (compilation) => {

  return new Promise(async (resolve, reject) => {
    try {
      const optimizeResourcePlugins = compilation.config.plugins.filter((plugin) => {
        return plugin.type === 'resource';
      }).map((plugin) => {
        return plugin.provider(compilation);
      }).filter((provider) => {
        return provider.shouldOptimize && provider.optimize;
      });
      // centrally register all static resources
      compilation.graph.map((page) => {
        return page.imports;
      }).flat().forEach(resource => {
        compilation.resources.set(resource.sourcePathURL.pathname, resource);
      });

      console.info('bundling static assets...');

      await Promise.all([
        await bundleScriptResources(compilation),
        await bundleStyleResources(compilation, optimizeResourcePlugins.filter(plugin => plugin.contentType.includes('text/css')))
      ]);

      console.info('optimizing static pages....');

      await optimizeStaticPages(compilation, optimizeResourcePlugins.filter(plugin => plugin.contentType.includes('text/html')));
      await cleanUpResources(compilation);

      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

export { bundleCompilation };