const bundleCompilation = require('../lifecycles/bundle');
const copyAssets = require('../lifecycles/copy');
const { devServer } = require('../lifecycles/serve');
const fs = require('fs');
const generateCompilation = require('../lifecycles/compile');
const path = require('path');
const pluginResourceStandardHtml = require('../plugins/resource/plugin-standard-html');
const pluginOptimizationMpa = require('../plugins/resource/plugin-optimization-mpa');
const prerenderCompilation = require('../lifecycles/prerender');
const { ServerInterface } = require('../lib/server-interface');

module.exports = runProductionBuild = async () => {

  return new Promise(async (resolve, reject) => {

    try {
      const compilation = await generateCompilation();
      const port = compilation.config.devServer.port;
      const outputDir = compilation.context.outputDir;

      if (compilation.config.prerender) {
        devServer(compilation).listen(port, async () => {
          console.info(`Started local development server at localhost:${port}`);
          
          // custom user server plugins
          const servers = [...compilation.config.plugins.filter((plugin) => {
            return plugin.type === 'server';
          }).map((plugin) => {
            const provider = plugin.provider(compilation);
  
            if (!(provider instanceof ServerInterface)) {
              console.warn(`WARNING: ${plugin.name}'s provider is not an instance of ServerInterface.`);
            }
  
            return provider;
          })];
  
          await Promise.all(servers.map(async (server) => {
            server.start();
  
            return Promise.resolve(server);
          }));
  
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
          }
      
          await prerenderCompilation(compilation);
          await bundleCompilation(compilation);
          await copyAssets(compilation);
  
          resolve();
        });
      } else {
        const pages = compilation.graph;
        const scratchDir = compilation.context.scratchDir;
        const htmlResource = pluginResourceStandardHtml.provider(compilation);
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

        console.info('pages to generate', `\n ${pages.map(page => page.path).join('\n ')}`);
        
        await Promise.all(pages.map(async (page) => {
          const route = page.route;
          const outputPath = `${scratchDir}${route.replace()}index.html`;
          const response = await htmlResource.serve(route);
          const htmlOptimized = await optimizeResources.reduce(async (htmlPromise, resource) => {
            const html = await htmlPromise;
            const shouldOptimize = await resource.shouldOptimize(outputPath, html);
            
            return shouldOptimize
              ? resource.optimize(outputPath, html)
              : Promise.resolve(html);
          }, Promise.resolve(response.body));

          console.info('generating page...', outputPath);

          if (!fs.existsSync(path.join(scratchDir, route))) {
            fs.mkdirSync(path.join(scratchDir, route), {
              recursive: true
            });
          }
          
          await fs.promises.writeFile(outputPath, htmlOptimized);

          return Promise.resolve();
        }));

        await bundleCompilation(compilation);
        await copyAssets(compilation);
        
        console.info('success, done generating all pages!');
        
        resolve();
      }
    } catch (err) {
      reject(err);
    }
  });
  
};