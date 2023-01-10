import fs from 'fs';
import htmlparser from 'node-html-parser';
import { modelResource } from '../lib/resource-utils.js';
import os from 'os';
import { WorkerPool } from '../lib/threadpool.js';

function isLocalLink(url = '') {
  return url !== '' && (url.indexOf('http') !== 0 && url.indexOf('//') !== 0);
}

function createOutputDirectory(route, { pathname }) {
  if (route !== '/404/' && !fs.existsSync(pathname)) {
    fs.mkdirSync(pathname, {
      recursive: true
    });
  }
}

// TODO does this make more sense in bundle lifecycle?
// https://github.com/ProjectEvergreen/greenwood/issues/970
// or could this be done sooner (like in appTemplate building in html resource plugin)?
// Or do we need to ensure userland code / plugins have gone first
// before we can curate the final list of <script> / <style> / <link> tags to bundle
function trackResourcesForRoute(html, compilation, route) {
  const { context } = compilation;
  const root = htmlparser.parse(html, {
    script: true,
    style: true
  });

  // intentionally support <script> tags from the <head> or <body>
  const scripts = root.querySelectorAll('script')
    .filter(script => (
      isLocalLink(script.getAttribute('src')) || script.rawText)
      && script.rawAttrs.indexOf('importmap') < 0)
    .map(script => {
      const src = script.getAttribute('src');
      const optimizationAttr = script.getAttribute('data-gwd-opt');
      const { rawAttrs } = script;

      if (src) {
        // <script src="...."></script>
        return modelResource(context, 'script', src, null, optimizationAttr, rawAttrs);
      } else if (script.rawText) {
        // <script>...</script>
        return modelResource(context, 'script', null, script.rawText, optimizationAttr, rawAttrs);
      }
    });

  const styles = root.querySelectorAll('style')
    .filter(style => !(/\$/).test(style.rawText) && !(/<!-- Shady DOM styles for -->/).test(style.rawText)) // filter out Shady DOM <style> tags that happen when using puppeteer
    .map(style => modelResource(context, 'style', null, style.rawText, null, style.getAttribute('data-gwd-opt')));

  const links = root.querySelectorAll('head link')
    .filter(link => {
      // <link rel="stylesheet" href="..."></link>
      return link.getAttribute('rel') === 'stylesheet'
        && link.getAttribute('href') && isLocalLink(link.getAttribute('href'));
    }).map(link => {
      return modelResource(context, 'link', link.getAttribute('href'), null, link.getAttribute('data-gwd-opt'), link.rawAttrs);
    });

  const resources = [
    ...scripts,
    ...styles,
    ...links
  ];

  compilation.graph.find(page => page.route === route).imports = resources;

  return resources;
}

async function servePage(url, request, plugins) {
  let response = new Response('');

  for (const plugin of plugins) {
    if (plugin.shouldServe && await plugin.shouldServe(url, request)) {
      response = await plugin.serve(url, request);
    }
  }

  return response;
}

async function interceptPage(url, request, plugins, body) {
  const headers = new Headers();
  headers.append('content-type', 'text/html');

  let response = new Response(body, { headers });

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
    const { route, outputPath } = page;
    const outputDirUrl = new URL(`./${route}/`, scratchDir);
    const outputPathUrl = new URL(`./${outputPath}`, scratchDir);
    const url = new URL(`http://localhost:${compilation.config.port}${route}`);
    const request = new Request(url);

    let body = await (await servePage(url, request, plugins)).text();
    body = await (await interceptPage(url, request, plugins, body)).text();

    createOutputDirectory(route, outputDirUrl);

    const resources = trackResourcesForRoute(body, compilation, route);
    const scripts = resources
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

    await fs.promises.writeFile(outputPathUrl, body);

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

    trackResourcesForRoute(body, compilation, route);
    createOutputDirectory(route, outputDirUrl);

    await fs.promises.writeFile(outputPathUrl, body);

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

    trackResourcesForRoute(body, compilation, route);
    createOutputDirectory(route, outputDirUrl);

    await fs.promises.writeFile(outputPathUrl, body);

    console.info('generated page...', route);

    return Promise.resolve();
  }));
}

export {
  preRenderCompilationWorker,
  preRenderCompilationCustom,
  staticRenderCompilation
};