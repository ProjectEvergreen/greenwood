/* eslint-disable max-depth, max-len */
import fs from 'fs/promises';
import { getRollupConfigForApis, getRollupConfigForScriptResources, getRollupConfigForSsr } from '../config/rollup.config.js';
import { getAppTemplate, getPageTemplate, getUserScripts } from '../lib/templating-utils.js';
import { hashString } from '../lib/hashing-utils.js';
import { checkResourceExists, mergeResponse, normalizePathnameForWindows } from '../lib/resource-utils.js';
import path from 'path';
import { rollup } from 'rollup';

async function interceptPage(url, request, plugins, body) {
  let response = new Response(body, {
    headers: new Headers({ 'Content-Type': 'text/html' })
  });

  for (const plugin of plugins) {
    if (plugin.shouldIntercept && await plugin.shouldIntercept(url, request, response)) {
      response = await plugin.intercept(url, request, response);
    }
  }

  return response;
}

function getPluginInstances(compilation) {
  return [...compilation.config.plugins]
    .filter(plugin => plugin.type === 'resource' && plugin.name !== 'plugin-node-modules:resource')
    .map((plugin) => {
      return plugin.provider(compilation);
    });
}

async function emitResources(compilation) {
  const { outputDir } = compilation.context;
  const { resources, graph } = compilation;

  // https://stackoverflow.com/a/56150320/417806
  await fs.writeFile(new URL('./resources.json', outputDir), JSON.stringify(resources, (key, value) => {
    if (value instanceof Map) {
      return {
        dataType: 'Map',
        value: [...value]
      };
    } else {
      return value;
    }
  }));

  await fs.writeFile(new URL('./graph.json', outputDir), JSON.stringify(graph));
}

async function cleanUpResources(compilation) {
  const { outputDir } = compilation.context;

  for (const resource of compilation.resources.values()) {
    const { src, optimizedFileName, optimizationAttr } = resource;
    const optConfig = ['inline', 'static'].indexOf(compilation.config.optimization) >= 0;
    const optAttr = ['inline', 'static'].indexOf(optimizationAttr) >= 0;

    if (optimizedFileName && (!src || (optAttr || optConfig))) {
      await fs.unlink(new URL(`./${optimizedFileName}`, outputDir));
    }
  }
}

async function optimizeStaticPages(compilation, plugins) {
  const { scratchDir, outputDir } = compilation.context;

  return Promise.all(compilation.graph
    .filter(page => !page.isSSR || (page.isSSR && page.prerender) || (page.isSSR && compilation.config.prerender))
    .map(async (page) => {
      const { route, outputPath } = page;
      const outputDirUrl = new URL(`.${outputPath.replace('index.html', '').replace('404.html', '')}`, outputDir);
      const url = new URL(`http://localhost:${compilation.config.port}${route}`);
      const contents = await fs.readFile(new URL(`./${outputPath}`, scratchDir), 'utf-8');
      const headers = new Headers({ 'Content-Type': 'text/html' });
      let response = new Response(contents, { headers });

      if (!await checkResourceExists(outputDirUrl)) {
        await fs.mkdir(outputDirUrl, {
          recursive: true
        });
      }

      for (const plugin of plugins) {
        if (plugin.shouldOptimize && await plugin.shouldOptimize(url, response.clone())) {
          const currentResponse = await plugin.optimize(url, response.clone());

          response = mergeResponse(response.clone(), currentResponse.clone());
        }
      }

      // clean up optimization markers
      const body = (await response.text()).replace(/data-gwd-opt=".*[a-z]"/g, '');

      await fs.writeFile(new URL(`.${outputPath}`, outputDir), body);
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
        const basename = path.basename(srcPath);
        const basenamePieces = path.basename(srcPath).split('.');
        const fileNamePieces = srcPath.split('/').filter(piece => piece !== ''); // normalize by removing any leading /'s

        optimizedFileName = srcPath.indexOf('/node_modules') >= 0
          ? `${basenamePieces[0]}.${hashString(contents)}.css`
          : fileNamePieces.join('/').replace(basename, `${basenamePieces[0]}.${hashString(contents)}.css`);
      } else {
        optimizedFileName = `${hashString(contents)}.css`;
      }

      const outputPathRoot = new URL(`./${optimizedFileName}`, outputDir)
        .pathname
        .split('/')
        .slice(0, -1)
        .join('/')
        .concat('/');
      const outputPathRootUrl = new URL(`file://${outputPathRoot}`);

      if (!await checkResourceExists(outputPathRootUrl)) {
        await fs.mkdir(new URL(`file://${outputPathRoot}`), {
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
            const currentResponse = await plugin.intercept(url, request, intermediateResponse.clone());
            const mergedResponse = mergeResponse(intermediateResponse.clone(), currentResponse.clone());

            if (mergedResponse.headers.get('Content-Type').indexOf(contentType) >= 0) {
              return Promise.resolve(mergedResponse.clone());
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

      await fs.writeFile(new URL(`./${optimizedFileName}`, outputDir), optimizedFileContents);
    }
  }
}

async function bundleApiRoutes(compilation) {
  // https://rollupjs.org/guide/en/#differences-to-the-javascript-api
  const [rollupConfig] = await getRollupConfigForApis(compilation);

  if (rollupConfig.input.length !== 0) {
    const bundle = await rollup(rollupConfig);
    await bundle.write(rollupConfig.output);
  }
}

async function bundleSsrPages(compilation) {
  // https://rollupjs.org/guide/en/#differences-to-the-javascript-api
  // TODO context plugins for SSR ?
  // const contextPlugins = compilation.config.plugins.filter((plugin) => {
  //   return plugin.type === 'context';
  // }).map((plugin) => {
  //   return plugin.provider(compilation);
  // });
  const hasSSRPages = compilation.graph.filter(page => page.isSSR).length > 0;
  const input = [];

  if (!compilation.config.prerender && hasSSRPages) {
    const htmlOptimizer = compilation.config.plugins.find(plugin => plugin.name === 'plugin-standard-html').provider(compilation);
    const { executeModuleUrl } = compilation.config.plugins.find(plugin => plugin.type === 'renderer').provider();
    const { executeRouteModule } = await import(executeModuleUrl);
    const { pagesDir, scratchDir } = compilation.context;

    for (const page of compilation.graph) {
      if (page.isSSR && !page.prerender) {
        const { imports, route, template, title, relativeWorkspacePagePath } = page;
        const entryFileUrl = new URL(`./_${relativeWorkspacePagePath.replace('/', '')}`, scratchDir);
        const moduleUrl = new URL(`./${relativeWorkspacePagePath.replace('/', '')}`, pagesDir);
        const outputPathRootUrl = new URL(`file://${path.dirname(entryFileUrl.pathname)}`);
        const request = new Request(moduleUrl); // TODO not really sure how to best no-op this?
        // TODO getTemplate has to be static (for now?)
        // https://github.com/ProjectEvergreen/greenwood/issues/955
        const data = await executeRouteModule({ moduleUrl, compilation, page, prerender: false, htmlContents: null, scripts: [], request });
        let staticHtml = '';

        staticHtml = data.template ? data.template : await getPageTemplate(staticHtml, compilation.context, template, []);
        staticHtml = await getAppTemplate(staticHtml, compilation.context, imports, [], false, title);
        staticHtml = await getUserScripts(staticHtml, compilation);
        staticHtml = await (await interceptPage(new URL(`http://localhost:8080${route}`), new Request(new URL(`http://localhost:8080${route}`)), getPluginInstances(compilation), staticHtml)).text();
        staticHtml = await (await htmlOptimizer.optimize(new URL(`http://localhost:8080${route}`), new Response(staticHtml))).text();
        staticHtml = staticHtml.replace(/[`\\$]/g, '\\$&'); // https://stackoverflow.com/a/75688937/417806

        if (!await checkResourceExists(outputPathRootUrl)) {
          await fs.mkdir(outputPathRootUrl, {
            recursive: true
          });
        }

        // better way to write out this inline code?
        await fs.writeFile(entryFileUrl, `
          import { executeRouteModule } from '${normalizePathnameForWindows(executeModuleUrl)}';

          export async function handler(request) {
            const compilation = JSON.parse('${JSON.stringify(compilation)}');
            const page = JSON.parse('${JSON.stringify(page)}');
            const moduleUrl = '___GWD_ENTRY_FILE_URL=${relativeWorkspacePagePath.replace('/', '')}___';
            const data = await executeRouteModule({ moduleUrl, compilation, page, request });
            let staticHtml = \`${staticHtml}\`;

            if (data.body) {
              staticHtml = staticHtml.replace(\/\<content-outlet>(.*)<\\/content-outlet>\/s, data.body);
            }

            return new Response(staticHtml, {
              headers: {
                'Content-Type': 'text/html'
              }
            });
          }
        `);

        input.push(normalizePathnameForWindows(moduleUrl));
        input.push(normalizePathnameForWindows(entryFileUrl));
      }
    }

    const [rollupConfig] = await getRollupConfigForSsr(compilation, input);

    if (rollupConfig.input.length > 0) {
      const bundle = await rollup(rollupConfig);
      await bundle.write(rollupConfig.output);
    }
  }
}

async function bundleScriptResources(compilation) {
  // https://rollupjs.org/guide/en/#differences-to-the-javascript-api
  const [rollupConfig] = await getRollupConfigForScriptResources(compilation);

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

      console.info('bundling static assets...');

      await Promise.all([
        await bundleApiRoutes(compilation),
        await bundleScriptResources(compilation),
        await bundleStyleResources(compilation, optimizeResourcePlugins)
      ]);

      // bundleSsrPages depends on bundleScriptResources having run first
      await bundleSsrPages(compilation);

      console.info('optimizing static pages....');
      await optimizeStaticPages(compilation, optimizeResourcePlugins);
      await cleanUpResources(compilation);
      await emitResources(compilation);

      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

export { bundleCompilation };