import fs from 'fs';
import htmlparser from 'node-html-parser';
import path from 'path';
import { Worker } from 'worker_threads';
import { pathToFileURL } from 'url';

async function interceptPage(compilation, contents, route) {
  const headers = {
    request: { 'accept': 'text/html', 'content-type': 'text/html' },
    response: { 'content-type': 'text/html' }
  };
  const interceptResources = compilation.config.plugins.filter((plugin) => {
    return plugin.type === 'resource' && !plugin.isGreenwoodDefaultPlugin;
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

async function optimizePage(compilation, contents, route, outputPath, outputDir) {
  const optimizeResources = compilation.config.plugins.filter((plugin) => {
    return plugin.type === 'resource';
  }).map((plugin) => {
    return plugin.provider(compilation);
  }).filter((provider) => {
    return provider.shouldOptimize && provider.optimize;
  });

  const htmlOptimized = await optimizeResources.reduce(async (htmlPromise, resource) => {
    const html = await htmlPromise;
    const shouldOptimize = await resource.shouldOptimize(outputPath, html);
    
    return shouldOptimize
      ? resource.optimize(outputPath, html)
      : Promise.resolve(html);
  }, Promise.resolve(contents));

  if (route !== '/404/' && !fs.existsSync(path.join(outputDir, route))) {
    fs.mkdirSync(path.join(outputDir, route), {
      recursive: true
    });
  }

  return htmlOptimized;
}

async function preRenderCompilationWorker(compilation, workerPrerender) {
  const pages = compilation.graph.filter(page => !page.isSSR);
  const outputDir = compilation.context.scratchDir;

  console.info('pages to generate', `\n ${pages.map(page => page.route).join('\n ')}`);

  await Promise.all(pages.map(async (page) => {
    const { outputPath, route } = page;
    const outputPathDir = path.join(outputDir, route);
    const htmlResource = compilation.config.plugins.filter((plugin) => {
      return plugin.name === 'plugin-standard-html';
    }).map((plugin) => {
      return plugin.provider(compilation);
    })[0];
    let html;

    html = (await htmlResource.serve(page.route)).body;
    html = (await interceptPage(compilation, html, route)).body;

    const root = htmlparser.parse(html, {
      script: true,
      style: true
    });

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

    html = await optimizePage(compilation, html, route, outputPath, outputDir);

    if (!fs.existsSync(outputPathDir)) {
      fs.mkdirSync(outputPathDir, {
        recursive: true
      });
    }

    console.info('generated page...', route);

    await fs.promises.writeFile(path.join(outputDir, outputPath), html);
  }));
}

async function preRenderCompilationCustom(compilation, customPrerender) {
  const { scratchDir } = compilation.context;
  const renderer = (await import(customPrerender.customUrl)).default;

  console.info('pages to generate', `\n ${compilation.graph.map(page => page.route).join('\n ')}`);

  await renderer(compilation, async (page, contents) => {
    const { outputPath, route } = page;

    console.info('generated page...', route);

    const html = await optimizePage(compilation, contents, route, outputPath, scratchDir);
    await fs.promises.writeFile(path.join(scratchDir, outputPath), html);
  });
}

async function staticRenderCompilation(compilation) {
  const pages = compilation.graph.filter(page => !page.isSSR || page.isSSR && page.data.static);
  const scratchDir = compilation.context.scratchDir;
  const htmlResource = compilation.config.plugins.filter((plugin) => {
    return plugin.name === 'plugin-standard-html';
  }).map((plugin) => {
    return plugin.provider(compilation);
  })[0];

  console.info('pages to generate', `\n ${pages.map(page => page.route).join('\n ')}`);
  
  await Promise.all(pages.map(async (page) => {
    const { route, outputPath } = page;
    let html = (await htmlResource.serve(route)).body;

    html = (await interceptPage(compilation, html, route)).body;
    html = await optimizePage(compilation, html, route, outputPath, scratchDir);

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