const fs = require('fs');
const path = require('path');
const Koa = require('koa');

const pluginNodeModulesResolver = require('../plugins/resource/plugin-node-modules-resolver');
const pluginUserWorkspaceResolver = require('../plugins/resource/plugin-user-workspace-resolver');
const pluginResourceNodeModules = require('../plugins/resource/plugin-node-modules-resolver');
const pluginResourceStandardCss = require('../plugins/resource/plugin-standard-css');
const pluginResourceStandardFont = require('../plugins/resource/plugin-standard-font');
const pluginResourceStandardHtml = require('../plugins/resource/plugin-standard-html');
const pluginResourceStandardImage = require('../plugins/resource/plugin-standard-image');
const pluginResourceStandardJavaScript = require('../plugins/resource/plugin-standard-javascript');
const pluginResourceStandardJson = require('../plugins/resource/plugin-standard-json');
const { ResourceInterface } = require('../lib/resource-interface');

// async function responseTime (ctx, next) {
//   console.log('Started tracking response time')
//   const started = Date.now()
//   await next()
//   // once all middleware below completes, this continues
//   const ellapsed = (Date.now() - started) + 'ms'
//   console.log('Response time is:', ellapsed)
//   ctx.set('X-ResponseTime', ellapsed)
// }
//
// app.use(responseTime)
// app.use(async (ctx, next) => {
//   ctx.status = 200
//   console.log('Setting status')
//   await next()
// })
// app.use(async (ctx) => {
//   await delay(1000)
//   console.log('Setting body')
//   ctx.body = 'Hello from Koa'
// })
// Started tracking response time
// Setting status
// Setting body
// Response time is: 1001ms

function getDevServer(compilation) {
  const app = new Koa();
  const compilationCopy = Object.assign({}, compilation);
  const resources = [
    // pluginResourceNodeModules.provider(compilationCopy),
    // pluginResourceStandardCss.provider(compilationCopy),
    // pluginResourceStandardFont.provider(compilationCopy),
    pluginResourceStandardHtml.provider(compilationCopy),
    // pluginResourceStandardImage.provider(compilationCopy),
    pluginResourceStandardJavaScript.provider(compilationCopy),
    // pluginResourceStandardJson.provider(compilationCopy),
    // ...userResourcePlugins
  ];

  // resolve a path (internal for now)
  app.use(async (ctx, next) => {
    console.debug('start resolve request url', ctx.url);
    // const resolvedUrl = '/';
    const resolveResources = [
      pluginUserWorkspaceResolver.provider(compilation),
      pluginNodeModulesResolver.provider(compilation)
    ];

    const fullResolvedUrl = await resolveResources.reduce(async (responsePromise, resource) => {
      const response = await responsePromise;
      const { url } = ctx; 
      // TODO move interface check somewhere else...
      if (resource.shouldResolve(url)) {
        const resolvedUrl = await resource.resolve(url);
        
        return Promise.resolve(resolvedUrl);
      } else {
        return Promise.resolve(response);
      }
    }, Promise.resolve(''));

    ctx.url = fullResolvedUrl;
    
    console.debug('******** final resolved request url', ctx.url);
    await next();
  });

  // serve all paths
  app.use(async (ctx, next) => {
    console.debug(`!!!!!!!!!!!!!!serve url => ${ctx.request.url}`);
    const respAcc = {
      body: ctx.body,
      contentType: ctx.response.contentType
    };
    
    const reducedResponse = await resources.reduce(async (responsePromise, resource) => {
      const response = await responsePromise;
      const { url } = ctx; 
      // TODO move interface check somewhere else...
      if (resource instanceof ResourceInterface && resource.shouldServe(url)) {
        const resolvedResource = await resource.serve(url);
        
        return Promise.resolve({
          ...response,
          ...resolvedResource
        });
      } else {
        return Promise.resolve(response);
      }
    }, Promise.resolve(respAcc));

    ctx.set('Content-Type', reducedResponse.contentType);
    ctx.body = reducedResponse.body;

    // await next();
  });

  // intercept





  // app.use(async ctx => {
  //   let response = {
  //     body: '',
  //     contentType: ''
  //   };

  //   // TODO prune
  //   const requestCopy = ctx.request;

  //   const compilationCopy = {
  //     ...compilation
  //   };

  //   const userResourcePlugins = compilation.config.plugins.filter((plugin) => { 
  //     return plugin.type === 'resource';
  //   }).map((plugin) => {
  //     return plugin.provider(compilationCopy);
  //   });

  //   try {
  //     // default resources to serve web standards, e.g. html (+ md), js, css
  //     const resources = [
  //       pluginResourceNodeModules.provider(compilationCopy),
  //       pluginResourceStandardCss.provider(compilationCopy),
  //       pluginResourceStandardFont.provider(compilationCopy),
  //       pluginResourceStandardHtml.provider(compilationCopy),
  //       // pluginResourceStandardImage.provider(compilationCopy),
  //       // pluginResourceStandardJavaScript.provider(compilationCopy),
  //       // pluginResourceStandardJson.provider(compilationCopy),
  //       ...userResourcePlugins
  //     ];

  //     const reducedResponse = await resources.reduce(async (responsePromise, resource) => {
  //       const response = await responsePromise;
  //       if (resource instanceof ResourceInterface && resource.shouldResolve(requestCopy)) {
  //         const resolvedResource = await resource.resolve(requestCopy);
          
  //         return Promise.resolve({
  //           ...response,
  //           ...resolvedResource
  //         });
  //       } else {
  //         return Promise.resolve(response);
  //       }
  //     }, Promise.resolve(response));

  //     response = {
  //       ...response,
  //       ...reducedResponse
  //     };

  //     ctx.set('Content-Type', `${response.contentType}`);
  //     ctx.body = response.body;
  //   } catch (err) {
  //     console.log(err);
  //   }
  // });

  return app;
}

function getProdServer(compilation) {
  const app = new Koa();

  app.use(async ctx => {
    // console.debug('URL', ctx.request.url);
    const { outputDir } = compilation.context;
    const { url } = ctx.request;

    if (url.endsWith('/') || url.endsWith('.html')) {
      const barePath = url.endsWith('/') ? path.join(url, 'index.html') : url;
      const contents = await fs.promises.readFile(path.join(outputDir, barePath), 'utf-8');
      ctx.set('Content-Type', 'text/html');
      ctx.body = contents;
    }

    if (url.endsWith('.js')) {
      const contents = await fs.promises.readFile(path.join(outputDir, url), 'utf-8');

      ctx.set('Content-Type', 'text/javascript');
      ctx.body = contents;
    }

    if (url.endsWith('.css')) {
      const contents = await fs.promises.readFile(path.join(outputDir, url), 'utf-8');

      ctx.set('Content-Type', 'text/css');
      ctx.body = contents;
    }

    // TODO break up into distinct font / icons / svg handlers, decouple from to assets/
    if (url.indexOf('assets/')) {
      const assetPath = path.join(outputDir, url);
      const ext = path.extname(assetPath);
      const type = ext === '.svg'
        ? `${ext.replace('.', '')}+xml`
        : ext.replace('.', '');

      if (['.jpg', '.png', '.gif', '.svg'].includes(ext)) {
        ctx.set('Content-Type', `image/${type}`);

        if (ext === '.svg') {
          ctx.body = await fs.promises.readFile(assetPath, 'utf-8');
        } else {
          ctx.body = await fs.promises.readFile(assetPath); 
        }
      } else if (['.woff2', '.woff', '.ttf'].includes(ext)) {
        ctx.set('Content-Type', `font/${type}`);
        ctx.body = await fs.promises.readFile(assetPath);
      } else if (['.ico'].includes(ext)) {
        ctx.set('Content-Type', 'image/x-icon');
        ctx.body = await fs.promises.readFile(assetPath);
      }
    }

    if (url.endsWith('.json')) {
      const contents = await fs.promises.readFile(path.join(outputDir, 'graph.json'), 'utf-8');

      ctx.set('Content-Type', 'application/json');
      ctx.body = JSON.parse(contents);
    }
  });
    
  return app;
}

module.exports = {
  devServer: getDevServer,
  prodServer: getProdServer
};