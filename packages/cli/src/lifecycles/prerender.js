import fs from 'fs';
import htmlparser from 'node-html-parser';
import { modelResource } from '../lib/resource-utils.js';
import os from 'os';
import path from 'path';
import { WorkerPool } from '../lib/threadpool.js';

function isLocalLink(url = '') {
  return url !== '' && (url.indexOf('http') !== 0 && url.indexOf('//') !== 0);
}

function createOutputDirectory(route, outputPathDir) {
  if (route !== '/404/' && !fs.existsSync(outputPathDir)) {
    fs.mkdirSync(outputPathDir, {
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

async function interceptPage(compilation, contents, route) {
  const headers = {
    request: { 'accept': 'text/html', 'content-type': 'text/html' },
    response: { 'content-type': 'text/html' }
  };
  const interceptResources = compilation.config.plugins.filter((plugin) => {
    return plugin.type === 'resource' && plugin.name !== 'plugin-node-modules:resource';
  }).map((plugin) => {
    return plugin.provider(compilation);
  }).filter((provider) => {
    return provider.shouldIntercept && provider.intercept;
  });

  const htmlIntercepted = await interceptResources.reduce(async (htmlPromise, resource) => {
    const html = (await htmlPromise).body;
    const shouldIntercept = await resource.shouldIntercept(route, html, headers);

    return shouldIntercept
      ? resource.intercept(route, html, headers)
      : htmlPromise;
  }, Promise.resolve({ body: contents }));

  return htmlIntercepted;
}

async function preRenderCompilationWorker(compilation, workerPrerender) {
  const pages = compilation.graph.filter(page => !page.isSSR || (page.isSSR && page.data.static) || (page.isSSR && compilation.config.prerender));
  const { scratchDir } = compilation.context;

  console.info('pages to generate', `\n ${pages.map(page => page.route).join('\n ')}`);

  const pool = new WorkerPool(os.cpus().length, workerPrerender.workerUrl);

  for (const page of pages) {
    const { outputPath, route } = page;
    const outputPathDir = path.join(scratchDir, route);
    const htmlResource = compilation.config.plugins.filter((plugin) => {
      return plugin.name === 'plugin-standard-html';
    }).map((plugin) => {
      return plugin.provider(compilation);
    })[0];
    let html;

    html = (await htmlResource.serve(route)).body;
    html = (await interceptPage(compilation, html, route)).body;

    createOutputDirectory(route, outputPathDir);

    const resources = trackResourcesForRoute(html, compilation, route);
    const scripts = resources
      .filter(resource => resource.type === 'script')
      .map(resource => resource.sourcePathURL.href);

    html = await new Promise((resolve, reject) => {
      pool.runTask({
        modulePath: null,
        compilation: JSON.stringify(compilation),
        route,
        prerender: true,
        htmlContents: html,
        scripts: JSON.stringify(scripts)
      }, (err, result) => {
        if (err) {
          return reject(err);
        }

        return resolve(result.html);
      });
    });

    await fs.promises.writeFile(path.join(scratchDir, outputPath), html);

    console.info('generated page...', route);
  }
}

async function preRenderCompilationCustom(compilation, customPrerender) {
  const { scratchDir } = compilation.context;
  const renderer = (await import(customPrerender.customUrl)).default;

  console.info('pages to generate', `\n ${compilation.graph.map(page => page.route).join('\n ')}`);

  await renderer(compilation, async (page, contents) => {
    const { outputPath, route } = page;
    const outputPathDir = path.join(scratchDir, route);

    // clean up special Greenwood dev only assets that would come through if prerendering with a headless browser
    contents = contents.replace(/<script src="(.*lit\/polyfill-support.js)"><\/script>/, '');
    contents = contents.replace(/<script type="importmap-shim">.*?<\/script>/s, '');
    contents = contents.replace(/<script defer="" src="(.*es-module-shims.js)"><\/script>/, '');
    contents = contents.replace(/type="module-shim"/g, 'type="module"');

    contents = (await interceptPage(compilation, contents, route)).body;

    // clean this up here to avoid sending webcomponents-bundle to rollup
    contents = contents.replace(/<script src="(.*webcomponents-bundle.js)"><\/script>/, '');

    trackResourcesForRoute(contents, compilation, route);
    createOutputDirectory(route, outputPathDir);

    await fs.promises.writeFile(path.join(scratchDir, outputPath), contents);

    console.info('generated page...', route);
  });
}

async function staticRenderCompilation(compilation) {
  const { scratchDir } = compilation.context;
  const pages = compilation.graph.filter(page => !page.isSSR || page.isSSR && page.data.static);
  const htmlResource = compilation.config.plugins.filter((plugin) => {
    return plugin.name === 'plugin-standard-html';
  }).map((plugin) => {
    return plugin.provider(compilation);
  })[0];

  console.info('pages to generate', `\n ${pages.map(page => page.route).join('\n ')}`);
  
  await Promise.all(pages.map(async (page) => {
    const { route, outputPath } = page;
    const outputPathDir = path.join(scratchDir, route);
    let html = (await htmlResource.serve(route)).body;
    html = (await interceptPage(compilation, html, route)).body;

    trackResourcesForRoute(html, compilation, route);
    createOutputDirectory(route, outputPathDir);

    await fs.promises.writeFile(path.join(scratchDir, outputPath), html);

    console.info('generated page...', route);

    return Promise.resolve();
  }));
}

export {
  preRenderCompilationWorker,
  preRenderCompilationCustom,
  staticRenderCompilation
};