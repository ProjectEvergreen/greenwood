const BrowserRunner = require('../lib/browser');
const fs = require('fs');
const path = require('path');
const pluginResourceStandardHtml = require('../plugins/resource/plugin-standard-html');
const pluginOptimizationMpa = require('../plugins/resource/plugin-optimization-mpa');

async function optimizePage(compilation, contents, route, outputDir) {
  const outputPath = `${outputDir}${route}index.html`;
  const optimizeResources = [
    pluginResourceStandardHtml.provider(compilation),
    pluginOptimizationMpa().provider(compilation),
    ...compilation.config.plugins.filter((plugin) => {
      const provider = plugin.provider(compilation);

      return plugin.type === 'resource' 
        && provider.shouldOptimize 
        && provider.optimize;
    }).map((plugin) => {
      return plugin.provider(compilation);
    })
  ];

  const htmlOptimized = await optimizeResources.reduce(async (htmlPromise, resource) => {
    const html = await htmlPromise;
    const shouldOptimize = await resource.shouldOptimize(outputPath, html);
    
    return shouldOptimize
      ? resource.optimize(outputPath, html)
      : Promise.resolve(html);
  }, Promise.resolve(contents));

  if (!fs.existsSync(path.join(outputDir, route))) {
    fs.mkdirSync(path.join(outputDir, route), {
      recursive: true
    });
  }
  
  await fs.promises.writeFile(outputPath, htmlOptimized);
}

async function preRenderCompilation(compilation) {
  const browserRunner = new BrowserRunner();

  const runBrowser = async (serverUrl, pages, outputDir) => {
    try {
      return Promise.all(pages.map(async(page) => {
        const { route } = page;
        console.info('prerendering page...', route);
        
        return await browserRunner
          .serialize(`${serverUrl}${route}`)
          .then(async (indexHtml) => {
            console.info(`prerendering complete for page ${route}.`);
            
            await optimizePage(compilation, indexHtml, route, outputDir);
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
    console.error('There was an error trying to initializing puppeteer for prerendering.');
    console.error(e);

    console.info('To troubleshoot, please check your environment for any npm install or postinstall errors as may be the case in a Stackblitz or other sandbox like environment.');
    console.info('For more information please see this guide - https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md');

    return Promise.reject(e);
  }

  return new Promise(async (resolve, reject) => {
    try {
      const pages = compilation.graph;
      const port = compilation.config.devServer.port;
      const outputDir = compilation.context.scratchDir;
      const serverAddress = `http://127.0.0.1:${port}`;

      console.info(`Prerendering pages at ${serverAddress}`);
      console.debug('pages to render', `\n ${pages.map(page => page.path).join('\n ')}`);
  
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
  const htmlResource = pluginResourceStandardHtml.provider(compilation);

  console.info('pages to generate', `\n ${pages.map(page => page.path).join('\n ')}`);
  
  await Promise.all(pages.map(async (page) => {
    const route = page.route;
    const response = await htmlResource.serve(route);

    await optimizePage(compilation, response.body, route, scratchDir);

    return Promise.resolve();
  }));
  
  console.info('success, done generating all pages!');
}

module.exports = {
  preRenderCompilation,
  staticRenderCompilation
};