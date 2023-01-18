/* eslint-disable max-depth */
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

    if (optimizedFileName && (!src || (optAttr || optConfig))) {
      fs.unlinkSync(new URL(`./${optimizedFileName}`, outputDir).pathname);
    }
  }
}

async function optimizeStaticPages(compilation, plugins) {
  const { scratchDir, outputDir } = compilation.context;

  return Promise.all(compilation.graph
    .filter(page => !page.isSSR || (page.isSSR && page.data.static) || (page.isSSR && compilation.config.prerender))
    .map(async (page) => {
      const { route, outputPath } = page;
      const url = new URL(`http://localhost:${compilation.config.port}${route}`);
      const contents = await fs.promises.readFile(new URL(`./${outputPath}`, scratchDir), 'utf-8');
      const headers = new Headers();

      headers.append('Content-Type', 'text/html');

      if (route !== '/404/' && !fs.existsSync(new URL(`.${route}`, outputDir).pathname)) {
        fs.mkdirSync(new URL(`.${route}`, outputDir).pathname, {
          recursive: true
        });
      }

      let response = new Response(contents, { headers });

      for (const plugin of plugins) {
        if (plugin.shouldOptimize && await plugin.shouldOptimize(url, response)) {
          response = await plugin.optimize(url, response);
        }
      }

      // clean up optimization markers
      const body = (await response.text()).replace(/data-gwd-opt=".*[a-z]"/g, '');

      await fs.promises.writeFile(new URL(`./${outputPath}`, outputDir), body);
    })
  );
}

async function bundleStyleResources(compilation, resourcePlugins) {
  const { outputDir } = compilation.context;

  for (const resource of compilation.resources.values()) {
    const { contents, optimizationAttr, src = '', type } = resource;

    if (['style', 'link'].includes(type)) {
      const resourceKey = resource.sourcePathURL.pathname;
      const srcPath = src && src.replace(/\.\.\//g, '').replace('./', '');
      let optimizedFileName;
      let optimizedFileContents;

      if (src) {
        // TODO remove path. usage
        const basename = path.basename(srcPath);
        const basenamePieces = path.basename(srcPath).split('.');
        const fileNamePieces = srcPath.split('/').filter(piece => piece !== ''); // normalize by removing any leading /'s  

        optimizedFileName = srcPath.indexOf('/node_modules') >= 0
          ? `${basenamePieces[0]}.${hashString(contents)}.css`
          : fileNamePieces.join('/').replace(basename, `${basenamePieces[0]}.${hashString(contents)}.css`);
      } else {
        optimizedFileName = `${hashString(contents)}.css`;
      }

      const outputPathRoot = new URL(`./${optimizedFileName}`, outputDir).pathname
        .split('/')
        .slice(0, -1)
        .join('/');

      if (!fs.existsSync(outputPathRoot)) {
        fs.mkdirSync(outputPathRoot, {
          recursive: true
        });
      }

      if (compilation.config.optimization === 'none' || optimizationAttr === 'none') {
        optimizedFileContents = contents;
      } else {
        const url = resource.sourcePathURL;
        const contentType = 'text/css';
        const headers = new Headers({ 'Content-Type': contentType });
        const request = new Request(url, { headers });
        const initResponse = new Response(contents, { headers });

        let response = await resourcePlugins.reduce(async (responsePromise, plugin) => {
          const intermediateResponse = await responsePromise;
          const shouldIntercept = plugin.shouldIntercept && await plugin.shouldIntercept(url, request, intermediateResponse.clone());

          if (shouldIntercept) {
            const thisResponse = await plugin.intercept(url, request, intermediateResponse.clone());

            if (thisResponse.headers.get('Content-Type').indexOf(contentType) >= 0) {
              return Promise.resolve(thisResponse.clone());
            }
          }

          return Promise.resolve(responsePromise);
        }, Promise.resolve(initResponse));

        response = await resourcePlugins.reduce(async (responsePromise, plugin) => {
          const intermediateResponse = await responsePromise;
          const shouldOptimize = plugin.shouldOptimize && await plugin.shouldOptimize(url, intermediateResponse.clone());

          return shouldOptimize
            ? Promise.resolve(await plugin.optimize(url, intermediateResponse.clone()))
            : Promise.resolve(responsePromise);
        }, Promise.resolve(response.clone()));

        optimizedFileContents = await response.text();
      }

      compilation.resources.set(resourceKey, {
        ...compilation.resources.get(resourceKey),
        optimizedFileName,
        optimizedFileContents
      });

      await fs.promises.writeFile(new URL(`./${optimizedFileName}`, outputDir), optimizedFileContents);
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
        return provider.shouldIntercept && provider.intercept
          || provider.shouldOptimize && provider.optimize;
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
        await bundleStyleResources(compilation, optimizeResourcePlugins)
      ]);

      console.info('optimizing static pages....');

      await optimizeStaticPages(compilation, optimizeResourcePlugins);
      await cleanUpResources(compilation);

      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

export { bundleCompilation };