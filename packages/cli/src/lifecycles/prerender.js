import { BrowserRunner } from '../lib/browser.js';
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

  return htmlOptimized;
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
            
            const html = await optimizePage(compilation, indexHtml, route, outputPath, outputDir);
            await fs.promises.writeFile(path.join(outputDir, outputPath), html);
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
      const pages = compilation.graph.filter(page => !page.isSSR);
      const port = compilation.config.devServer.port;
      const outputDir = compilation.context.scratchDir;
      const serverAddress = `http://127.0.0.1:${port}`;
      const customPrerender = (compilation.config.plugins.filter(plugin => plugin.type === 'renderer' && !plugin.isGreenwoodDefaultPlugin) || []).length === 1
        ? compilation.config.plugins.filter(plugin => plugin.type === 'renderer')[0].provider(compilation)
        : {};

      console.debug('pages to render', `\n ${pages.map(page => page.route).join('\n ')}`);
  
      if (customPrerender.prerender) {
        console.debug('use users custom renderer for prerendering!!!!!');
        for (const page of pages) {
          const { outputPath, route } = page;
          const outputPathDir = path.join(outputDir, route);
          const htmlResource = compilation.config.plugins.filter((plugin) => {
            return plugin.name === 'plugin-standard-html';
          }).map((plugin) => {
            return plugin.provider(compilation);
          })[0];
          let html;

          html = (await htmlResource.serve(page.route)).body;
          // TODO html = await interceptPage(compilation, html, route);

          const root = htmlparser.parse(html, {
            script: true,
            style: true
          });

          const headScripts = root.querySelectorAll('script')
            .filter(script => {
              return script.getAttribute('type') === 'module'
                && script.getAttribute('src') && script.getAttribute('src').indexOf('http') < 0;
            }).map(script => {
              console.debug('src??', `./${script.getAttribute('src').replace(/\.\.\//g, '').replace('./', '')}`);
              return pathToFileURL(path.join(compilation.context.userWorkspace, script.getAttribute('src').replace(/\.\.\//g, '').replace('./', '')));
            });

          await new Promise((resolve, reject) => {
            const worker = new Worker(customPrerender.workerUrl, {
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

          // TODO html = await optimizePage(compilation, html, route, outputPath, outputDir);
          // console.debug({ html });

          if (!fs.existsSync(outputPathDir)) {
            fs.mkdirSync(outputPathDir, {
              recursive: true
            });
          }

          await fs.promises.writeFile(path.join(outputDir, outputPath), html);
        }
      } else {
        console.info(`Prerendering pages at ${serverAddress}`);
        await runBrowser(serverAddress, pages, outputDir);
        browserRunner.close();
      }
      
      console.info('done prerendering all pages');

      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

async function staticRenderCompilation(compilation) {
  const pages = compilation.graph.filter(page => !page.isSSR);
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

    const html = await optimizePage(compilation, response.body, route, outputPath, scratchDir);
    await fs.promises.writeFile(path.join(scratchDir, outputPath), html);

    return Promise.resolve();
  }));
  
  console.info('success, done generating all pages!');
}

export {
  preRenderCompilation,
  staticRenderCompilation
};