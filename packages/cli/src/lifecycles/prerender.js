import fs from 'fs/promises';
import { checkResourceExists, trackResourcesForRoute } from '../lib/resource-utils.js';
import os from 'os';
import { WorkerPool } from '../lib/threadpool.js';

// TODO a lot of these are duplicated in the build lifecycle too
// would be good to refactor
async function createOutputDirectory(route, outputDir) {
  if (route !== '/404/' && !await checkResourceExists(outputDir)) {
    await fs.mkdir(outputDir, {
      recursive: true
    });
  }
}

async function servePage(url, request, plugins) {
  let response = new Response('');

  for (const plugin of plugins) {
    if (plugin.shouldServe && await plugin.shouldServe(url, request)) {
      response = await plugin.serve(url, request);
      break;
    }
  }

  return response;
}

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

function getPluginInstances (compilation) {
  return [...compilation.config.plugins]
    .filter(plugin => plugin.type === 'resource' && plugin.name !== 'plugin-node-modules:resource')
    .map((plugin) => {
      return plugin.provider(compilation);
    });
}

async function preRenderCompilationWorker(compilation, workerPrerender) {
  const pages = compilation.graph.filter(page => !page.isSSR || (page.isSSR && page.data.static) || (page.isSSR && compilation.config.prerender));
  const { scratchDir } = compilation.context;
  const plugins = getPluginInstances(compilation);

  console.info('pages to generate', `\n ${pages.map(page => page.route).join('\n ')}`);

  const pool = new WorkerPool(os.cpus().length, workerPrerender.workerUrl);

  for (const page of pages) {
    const { route, outputPath, resources } = page;
    const outputDirUrl = new URL(`./${route}/`, scratchDir);
    const outputPathUrl = new URL(`./${outputPath}`, scratchDir);
    const url = new URL(`http://localhost:${compilation.config.port}${route}`);
    const request = new Request(url);

    let body = await (await servePage(url, request, plugins)).text();
    body = await (await interceptPage(url, request, plugins, body)).text();

    await createOutputDirectory(route, outputDirUrl);

    const scripts = resources
      .map(resource => compilation.resources.get(resource))
      .filter(resource => resource.type === 'script')
      .map(resource => resource.sourcePathURL.href);

    body = await new Promise((resolve, reject) => {
      pool.runTask({
        modulePath: null,
        compilation: JSON.stringify(compilation),
        route,
        prerender: true,
        htmlContents: body,
        scripts: JSON.stringify(scripts)
      }, (err, result) => {
        if (err) {
          return reject(err);
        }

        return resolve(result.html);
      });
    });

    await fs.writeFile(outputPathUrl, body);

    console.info('generated page...', route);
  }
}

async function preRenderCompilationCustom(compilation, customPrerender) {
  const { scratchDir } = compilation.context;
  const renderer = (await import(customPrerender.customUrl)).default;

  console.info('pages to generate', `\n ${compilation.graph.map(page => page.route).join('\n ')}`);

  await renderer(compilation, async (page, body) => {
    const { route, outputPath } = page;
    const outputDirUrl = new URL(`./${route}`, scratchDir);
    const outputPathUrl = new URL(`./${outputPath}`, scratchDir);

    // clean up special Greenwood dev only assets that would come through if prerendering with a headless browser
    body = body.replace(/<script src="(.*lit\/polyfill-support.js)"><\/script>/, '');
    body = body.replace(/<script type="importmap-shim">.*?<\/script>/s, '');
    body = body.replace(/<script defer="" src="(.*es-module-shims.js)"><\/script>/, '');
    body = body.replace(/type="module-shim"/g, 'type="module"');

    // clean this up here to avoid sending webcomponents-bundle to rollup
    body = body.replace(/<script src="(.*webcomponents-bundle.js)"><\/script>/, '');

    await trackResourcesForRoute(body, compilation, route);
    await createOutputDirectory(route, outputDirUrl);
    await fs.writeFile(outputPathUrl, body);

    console.info('generated page...', route);
  });
}

async function staticRenderCompilation(compilation) {
  const { scratchDir } = compilation.context;
  const pages = compilation.graph.filter(page => !page.isSSR || page.isSSR && page.data.static);
  const plugins = getPluginInstances(compilation);

  console.info('pages to generate', `\n ${pages.map(page => page.route).join('\n ')}`);
  
  await Promise.all(pages.map(async (page) => {
    const { route, outputPath } = page;
    const outputDirUrl = new URL(`.${route}`, scratchDir);
    const outputPathUrl = new URL(`./${outputPath}`, scratchDir);
    const url = new URL(`http://localhost:${compilation.config.port}${route}`);
    const request = new Request(url);

    let body = await (await servePage(url, request, plugins)).text();
    body = await (await interceptPage(url, request, plugins, body)).text();

    await createOutputDirectory(route, outputDirUrl);
    await fs.writeFile(outputPathUrl, body);

    console.info('generated page...', route);

    return Promise.resolve();
  }));
}

export {
  preRenderCompilationWorker,
  preRenderCompilationCustom,
  staticRenderCompilation
};