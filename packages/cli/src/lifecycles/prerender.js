import fs from 'fs';
import htmlparser from 'node-html-parser';
import { modelResource } from '../lib/resource-utils.js';
import path from 'path';
import { pathToFileURL } from 'url';
import { Worker } from 'worker_threads';

function isLocalLink(url = '') {
  return url.indexOf('http') !== 0 && url.indexOf('//') !== 0;
}

// TODO does this make more sense in bundle lifecycle?
// TODO or could this be done sooner (like in appTemplate building in html resource plugin)?
// Or do we need to ensure userland code / plugins have gone first
// before we can curate the final list of <script> / <style> / <link> tags to bundle
function trackResourcesForRoute(html, compilation, route) {
  const { context } = compilation;
  const root = htmlparser.parse(html, {
    script: true,
    style: true
  });

  const scripts = root.querySelectorAll('head script')
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

  const styles = root.querySelectorAll('head style')
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

  compilation.graph.find(page => page.route === route).imports = [
    ...scripts,
    ...styles,
    ...links
  ];
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
  const pages = compilation.graph.filter(page => !page.isSSR);
  const { scratchDir } = compilation.context;

  console.info('pages to generate', `\n ${pages.map(page => page.route).join('\n ')}`);

  await Promise.all(pages.map(async (page) => {
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

    // TODO should this be done for all renderers?
    trackResourcesForRoute(html, compilation, route);

    const root = htmlparser.parse(html, {
      script: true,
      style: true
    });

    // TODO get this from graph / resources
    const headScripts = root.querySelectorAll('script')
      .filter(script => {
        return script.getAttribute('type') === 'module'
          && script.getAttribute('src') && script.getAttribute('src').indexOf('http') < 0;
      }).map(script => {
        return pathToFileURL(path.join(compilation.context.userWorkspace, script.getAttribute('src').replace(/\.\.\//g, '').replace('./', '')));
      });

    await new Promise((resolve, reject) => {
      const worker = new Worker(workerPrerender.workerUrl, {
        workerData: {
          modulePath: null,
          compilation: JSON.stringify(compilation),
          route,
          prerender: true,
          htmlContents: html,
          scripts: JSON.stringify(headScripts)
        }
      });
      worker.on('message', (result) => {
        if (result.html) {
          html = result.html;
        }
        resolve();
      });
      worker.on('error', reject);
      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });

    console.info('generated page...', route);
    // TODO should this be done for all renderers?
    if (route !== '/404/' && !fs.existsSync(outputPathDir)) {
      fs.mkdirSync(outputPathDir, {
        recursive: true
      });
    }

    await fs.promises.writeFile(path.join(scratchDir, outputPath), html);
  }));
}

async function preRenderCompilationCustom(compilation, customPrerender) {
  const { scratchDir } = compilation.context;
  const renderer = (await import(customPrerender.customUrl)).default;

  console.info('pages to generate', `\n ${compilation.graph.map(page => page.route).join('\n ')}`);

  await renderer(compilation, async (page, contents) => {
    const { outputPath, route } = page;
    const outputPathDir = path.join(scratchDir, route);

    // TODO should this be done for all renderers?
    if (route !== '/404/' && !fs.existsSync(outputPathDir)) {
      fs.mkdirSync(outputPathDir, {
        recursive: true
      });
    }

    console.info('generated page...', route);

    // TODO should this be done for all renderers?
    trackResourcesForRoute(contents, compilation, route);

    await fs.promises.writeFile(path.join(scratchDir, outputPath), contents);
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

    // TODO should this be done for all renderers?
    trackResourcesForRoute(html, compilation, route);

    // TODO should this be done for all renderers?
    if (route !== '/404/' && !fs.existsSync(outputPathDir)) {
      fs.mkdirSync(outputPathDir, {
        recursive: true
      });
    }

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