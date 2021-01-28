const fs = require('fs');
const path = require('path');
const Koa = require('koa');

const pluginNodeModules = require('../plugins/resource/plugin-node-modules');
const pluginResourceStandardCss = require('../plugins/resource/plugin-standard-css');
const pluginResourceStandardFont = require('../plugins/resource/plugin-standard-font');
const pluginResourceStandardHtml = require('../plugins/resource/plugin-standard-html');
const pluginResourceStandardImage = require('../plugins/resource/plugin-standard-image');
const pluginResourceStandardJavaScript = require('../plugins/resource/plugin-standard-javascript');
const pluginResourceStandardJson = require('../plugins/resource/plugin-standard-json');
const { ResourceInterface } = require('../lib/resource-interface');
const pluginUserWorkspace = require('../plugins/resource/plugin-user-workspace');

function getDevServer(compilation) {
  const app = new Koa();
  const compilationCopy = Object.assign({}, compilation);
  const resources = [
    // Greenwood default standard resource and import plugins
    pluginUserWorkspace.provider(compilation),
    pluginNodeModules.provider(compilation),
    pluginResourceStandardCss.provider(compilationCopy),
    pluginResourceStandardFont.provider(compilationCopy),
    pluginResourceStandardHtml.provider(compilationCopy),
    pluginResourceStandardImage.provider(compilationCopy),
    pluginResourceStandardJavaScript.provider(compilationCopy),
    pluginResourceStandardJson.provider(compilationCopy),

    // custom user resource plugins
    ...compilation.config.plugins.filter((plugin) => {
      return plugin.type === 'resource';
    }).map((plugin) => {
      const provider = plugin.provider(compilationCopy);

      if (!(provider instanceof ResourceInterface)) {
        console.warn(`WARNING: ${plugin.name}'s provider is not an instance of ResourceInterface.`);
      }

      return provider;
    })
  ];

  // resolve urls to paths first
  app.use(async (ctx, next) => {
    ctx.url = await resources.reduce(async (responsePromise, resource) => {
      const response = await responsePromise;
      const { url } = ctx;
      const resourceShouldResolveUrl = await resource.shouldResolve(url);
      
      return resourceShouldResolveUrl
        ? resource.resolve(url)
        : Promise.resolve(response);
    }, Promise.resolve(''));

    await next();
  });

  // then handle serving urls
  app.use(async (ctx, next) => {
    const responseAccumulator = {
      body: ctx.body,
      contentType: ctx.response.contentType
    };
    
    const reducedResponse = await resources.reduce(async (responsePromise, resource) => {
      const response = await responsePromise;
      const { url, headers } = ctx;
      const shouldServe = await resource.shouldServe(url, headers);

      if (shouldServe) {
        const resolvedResource = await resource.serve(url, headers);
        
        return Promise.resolve({
          ...response,
          ...resolvedResource
        });
      } else {
        return Promise.resolve(response);
      }
    }, Promise.resolve(responseAccumulator));

    ctx.set('Content-Type', reducedResponse.contentType);
    ctx.body = reducedResponse.body;

    await next();
  });

  // allow intercepting of urls
  app.use(async (ctx) => {
    const reducedResponse = await resources.reduce(async (responsePromise, resource) => {
      const response = await responsePromise;
      const { url } = ctx;
      const { headers } = ctx.response;
      const shouldIntercept = await resource.shouldIntercept(url, headers);

      if (shouldIntercept) {
        const interceptedResponse = await resource.intercept(response, headers);
        
        return Promise.resolve(interceptedResponse);
      } else {
        return Promise.resolve(response);
      }
    }, Promise.resolve(ctx.body));

    ctx.body = reducedResponse;
  });

  return app;
}

function getProdServer(compilation) {
  const app = new Koa();

  app.use(async ctx => {
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