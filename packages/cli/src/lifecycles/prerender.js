import { BrowserRunner } from '../lib/browser.js';
import fs from 'fs';
import path from 'path';

async function interceptPage(compilation, contents, route) {
  const headers = {
    request: { 'accept': 'text/hml', 'content-type': 'text/html' },
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
    const html = (await htmlPromise).body || '';
    const shouldIntercept = await resource.shouldIntercept(route, html, headers);

    return shouldIntercept
      ? resource.intercept(route, html, headers)
      : Promise.resolve(html);
  }, Promise.resolve(contents));

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
  
  await fs.promises.writeFile(path.join(outputDir, outputPath), htmlOptimized);
}

async function preRenderCompilation(compilation) {
  const browserRunner = new BrowserRunner();

  const runBrowser = async (serverUrl, pages, outputDir) => {
    try {
      return Promise.all(pages.map(async(page) => {
        const { outputPath, route } = page;
        console.info('prerendering page...', route);
        
        return await browserRunner
          .serialize(`${serverUrl}${route}`)
          .then(async (indexHtml) => {
            console.info(`prerendering complete for page ${route}.`);
            
            await optimizePage(compilation, indexHtml, route, outputPath, outputDir);
          });
      }));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(err);
      return false;
    }
  };

  // gracefully handle if puppeteer is not installed correctly
  // like may happen in a stackblitz environment and just reject early
  // otherwise we can feel confident attempating to prerender all pages
  // https://github.com/ProjectEvergreen/greenwood/discussions/639
  try {
    await browserRunner.init();
  } catch (e) {
    console.error(e);

    console.error('*******************************************************************');
    console.error('*******************************************************************');

    console.error('There was an error trying to initialize puppeteer for pre-rendering.');

    console.info('To troubleshoot, please check your environment for any npm install or postinstall errors, as may be the case in a Stackblitz or other sandbox like environment.');
    console.info('For more information please see this guide - https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md');

    return Promise.reject();
  }

  return new Promise(async (resolve, reject) => {
    try {
      const pages = compilation.graph;
      const port = compilation.config.devServer.port;
      const outputDir = compilation.context.scratchDir;
      const serverAddress = `http://127.0.0.1:${port}`;

      console.info(`Prerendering pages at ${serverAddress}`);
      console.debug('pages to render', `\n ${pages.map(page => page.route).join('\n ')}`);
  
      await runBrowser(serverAddress, pages, outputDir);
      
      console.info('done prerendering all pages');
      browserRunner.close();

      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

async function staticRenderCompilation(compilation) {
  const pages = compilation.graph;
  const scratchDir = compilation.context.scratchDir;
  const htmlResource = compilation.config.plugins.filter((plugin) => {
    return plugin.name === 'plugin-standard-html';
  }).map((plugin) => {
    return plugin.provider(compilation);
  })[0];

  console.info('pages to generate', `\n ${pages.map(page => page.path).join('\n ')}`);
  
  await Promise.all(pages.map(async (page) => {
    const { route, outputPath } = page;
    let response = await htmlResource.serve(route);

    response = await interceptPage(compilation, response, route);

    await optimizePage(compilation, response.body, route, outputPath, scratchDir);

    return Promise.resolve();
  }));
  
  console.info('success, done generating all pages!');
}

export {
  preRenderCompilation,
  staticRenderCompilation
};