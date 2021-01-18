const BrowserRunner = require('../lib/browser');
const { promises: fsp } = require('fs');
const fs = require('fs');
const path = require('path');

module.exports = serializeCompilation = async (compilation) => {
  const compilationCopy = Object.assign({}, compilation);
  const browserRunner = new BrowserRunner();
  const optimizeResources = [
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
          .then(async (html) => {
            const outputPath = `${outputDir}${route}index.html`;
            
            // TODO allow setup / teardown (e.g. module shims, then remove module-shims)
            let htmlModified = html;
  
            // TODO should really be happening via plugins or other standardize setup / teardown mechanism
            htmlModified = htmlModified.replace(/<script src="\/node_modules\/@webcomponents\/webcomponentsjs\/webcomponents-bundle.js"><\/script>/, '');
            htmlModified = htmlModified.replace(/<script type="importmap-shim">.*?<\/script>/s, '');
            htmlModified = htmlModified.replace(/<script defer="" src="\/node_modules\/es-module-shims\/dist\/es-module-shims.js"><\/script>/, '');
            htmlModified = htmlModified.replace(/<script type="module-shim"/g, '<script type="module"');
  
            console.info(`Serializing complete for page ${route}.`);
            
            htmlModified = await optimizeResources.reduce(async (htmlPromise, resource) => {
              const html = await htmlPromise;
              
              return resource.shouldOptimize(html)
                ? resource.optimize(html)
                : Promise.resolve(html);
            }, Promise.resolve(htmlModified));

            if (!fs.existsSync(path.join(outputDir, route))) {
              fs.mkdirSync(path.join(outputDir, route), {
                recursive: true
              });
            }
            
            await fsp.writeFile(outputPath, htmlModified);
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