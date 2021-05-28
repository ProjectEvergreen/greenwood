const fs = require('fs');
const path = require('path');
const Koa = require('koa');

const pluginNodeModules = require('../plugins/resource/plugin-node-modules');
const pluginDevProxyResource = require('../plugins/resource/plugin-dev-proxy');
const pluginResourceOptimizationMpa = require('../plugins/resource/plugin-optimization-mpa');
const pluginSourceMaps = require('../plugins/resource/plugin-source-maps');
const pluginResourceStandardCss = require('../plugins/resource/plugin-standard-css');
const pluginResourceStandardFont = require('../plugins/resource/plugin-standard-font');
const pluginResourceStandardHtml = require('../plugins/resource/plugin-standard-html');
const pluginResourceStandardImage = require('../plugins/resource/plugin-standard-image');
const pluginResourceStandardJavaScript = require('../plugins/resource/plugin-standard-javascript');
const pluginResourceStandardJson = require('../plugins/resource/plugin-standard-json');
const pluginLiveReloadResource = require('../plugins/server/plugin-livereload')()[1];
const pluginUserWorkspace = require('../plugins/resource/plugin-user-workspace');
const { ResourceInterface } = require('../lib/resource-interface');

function getDevServer(compilation) {
  const app = new Koa();
  const compilationCopy = Object.assign({}, compilation);
  const resources = [
    // Greenwood default standard resource and import plugins
    pluginUserWorkspace.provider(compilation),
    pluginNodeModules[0].provider(compilation),
    pluginDevProxyResource.provider(compilationCopy),
    pluginResourceStandardCss.provider(compilationCopy),
    pluginResourceStandardFont.provider(compilationCopy),
    pluginResourceStandardHtml.provider(compilationCopy),
    pluginResourceStandardImage.provider(compilationCopy),
    pluginResourceStandardJavaScript[0].provider(compilationCopy),
    pluginResourceStandardJson[0].provider(compilationCopy),
    pluginSourceMaps.provider(compilationCopy),
    pluginResourceOptimizationMpa().provider(compilationCopy),

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
    }, Promise.resolve(ctx.url));

    // bit of a hack to get these two bugs to play well together
    // https://github.com/ProjectEvergreen/greenwood/issues/598
    // https://github.com/ProjectEvergreen/greenwood/issues/604
    ctx.request.headers.originalUrl = ctx.originalUrl;

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
      const { url } = ctx;
      const { headers } = ctx.response;
      const shouldServe = await resource.shouldServe(url, {
        request: ctx.headers,
        response: headers
      });

      if (shouldServe) {
        const resolvedResource = await resource.serve(url, {
          request: ctx.headers,
          response: headers
        });
        
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

  // allow intercepting of urls (response)
  app.use(async (ctx) => {
    const modifiedResources = resources.concat(
      pluginLiveReloadResource.provider(compilation)
    );
    const responseAccumulator = {
      body: ctx.body,
      contentType: ctx.response.headers['content-type']
    };

    const reducedResponse = await modifiedResources.reduce(async (responsePromise, resource) => {
      const response = await responsePromise;
      const { url } = ctx;
      const { headers } = ctx.response;
      const shouldIntercept = await resource.shouldIntercept(url, response.body, {
        request: ctx.headers,
        response: headers
      });

      if (shouldIntercept) {
        const interceptedResponse = await resource.intercept(url, response.body, {
          request: ctx.headers,
          response: headers
        });
        
        return Promise.resolve({
          ...response,
          ...interceptedResponse
        });
      } else {
        return Promise.resolve(response);
      }
    }, Promise.resolve(responseAccumulator));

    ctx.set('Content-Type', reducedResponse.contentType);
    ctx.body = reducedResponse.body;
  });

  return app;
}

function getProdServer(compilation) {
  const app = new Koa();
  const proxyPlugin = pluginDevProxyResource.provider(compilation);

  app.use(async ctx => {
    const { outputDir } = compilation.context;
    const { mode } = compilation.config;
    const url = ctx.request.url.replace(/\?(.*)/, ''); // get rid of things like query string parameters

    if (url.endsWith('/') || url.endsWith('.html')) {
      const barePath = mode === 'spa'
        ? 'index.html'
        : url.endsWith('/')
          ? path.join(url, 'index.html')
          : url;
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
      const contents = await fs.promises.readFile(path.join(outputDir, url), 'utf-8');

      ctx.set('Content-Type', 'application/json');
      ctx.body = JSON.parse(contents);
    }

    if (url !== '/' && await proxyPlugin.shouldServe(url)) {
      ctx.body = (await proxyPlugin.serve(url)).body;
    }
  });
    
  return app;
}

module.exports = {
  devServer: getDevServer,
  prodServer: getProdServer
};