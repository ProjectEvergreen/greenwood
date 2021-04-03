const BrowserRunner = require('../lib/browser');
const fs = require('fs');
const path = require('path');
const pluginResourceStandardHtml = require('../plugins/resource/plugin-standard-html');
const pluginOptimizationMpa = require('../plugins/resource/plugin-optimization-mpa');

module.exports = serializeCompilation = async (compilation) => {
  const compilationCopy = Object.assign({}, compilation);
  const browserRunner = new BrowserRunner();
  const optimizeResources = [
    pluginResourceStandardHtml.provider(compilationCopy),
    pluginOptimizationMpa().provider(compilationCopy),
    ...compilation.config.plugins.filter((plugin) => {
      const provider = plugin.provider(compilationCopy);

      return plugin.type === 'resource' 
        && provider.shouldOptimize 
        && provider.optimize;
    }).map((plugin) => {
      return plugin.provider(compilationCopy);
    })
  ];

  await browserRunner.init();

  const runBrowser = async (serverUrl, pages, outputDir) => {
    try {
      return Promise.all(pages.map(async(page) => {
        const { route } = page;
        console.info('serializing page...', route);
        
        return await browserRunner
          .serialize(`${serverUrl}${route}`)
          .then(async (indexHtml) => {
            const outputPath = `${outputDir}${route}index.html`;
            console.info(`Serializing complete for page ${route}.`);
            
            const htmlOptimized = await optimizeResources.reduce(async (htmlPromise, resource) => {
              const html = await htmlPromise;
              const shouldOptimize = await resource.shouldOptimize(outputPath, html);
              
              return shouldOptimize
                ? resource.optimize(outputPath, html)
                : Promise.resolve(html);
            }, Promise.resolve(indexHtml));

            if (!fs.existsSync(path.join(outputDir, route))) {
              fs.mkdirSync(path.join(outputDir, route), {
                recursive: true
              });
            }
            
            await fs.promises.writeFile(outputPath, htmlOptimized);
          });
      }));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(err);
      return false;
    }
  };

  return new Promise(async (resolve, reject) => {
    try {
      const pages = compilation.graph;
      const port = compilation.config.devServer.port;
      const outputDir = compilation.context.scratchDir;
      const serverAddress = `http://127.0.0.1:${port}`;

      console.info(`Serializing pages at ${serverAddress}`);
      console.debug('pages to generate', `\n ${pages.map(page => page.path).join('\n ')}`);
  
      await runBrowser(serverAddress, pages, outputDir);
      
      console.info('done serializing all pages');
      browserRunner.close();

      resolve();
    } catch (err) {
      reject(err);
    }
  });
};