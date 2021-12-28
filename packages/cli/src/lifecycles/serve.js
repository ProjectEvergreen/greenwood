import fs from 'fs';
import path from 'path';
import Koa from 'koa';
import { ResourceInterface } from '../lib/resource-interface.js';

async function getDevServer(compilation) {
  const app = new Koa();
  const compilationCopy = Object.assign({}, compilation);
  const resources = [
    // Greenwood default standard resource and import plugins
    ...compilation.config.plugins.filter((plugin) => {
      return plugin.type === 'resource' && plugin.isGreenwoodDefaultPlugin;
    }).map((plugin) => {
      return plugin.provider(compilationCopy);
    }),

    // custom user resource plugins
    ...compilation.config.plugins.filter((plugin) => {
      return plugin.type === 'resource' && !plugin.isGreenwoodDefaultPlugin;
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
      const resourceShouldResolveUrl = await resource.shouldResolve(response);
      
      return resourceShouldResolveUrl
        ? resource.resolve(response)
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
    const responseAccumulator = {
      body: ctx.body,
      contentType: ctx.response.headers['content-type']
    };

    const reducedResponse = await resources.reduce(async (responsePromise, resource) => {
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

  return Promise.resolve(app);
}

async function getStaticServer(compilation, composable) {
  const app = new Koa();
  const standardResources = compilation.config.plugins.filter((plugin) => {
    // html is intentionally omitted
    return plugin.isGreenwoodDefaultPlugin
      && plugin.type === 'resource'
      && ((plugin.name.indexOf('plugin-standard') >= 0 // allow standard web resources
      && plugin.name.indexOf('plugin-standard-html') < 0) // but _not_ our markdown / HTML plugin
      || plugin.name.indexOf('plugin-source-maps') >= 0); // and source maps
  }).map((plugin) => {
    return plugin.provider(compilation);
  });

  app.use(async (ctx, next) => {
    const { outputDir } = compilation.context;
    const { mode } = compilation.config;
    const url = ctx.request.url.replace(/\?(.*)/, ''); // get rid of things like query string parameters

    // only handle static output routes, eg. public/about.html
    if (url.endsWith('/') || url.endsWith('.html')) {
      const barePath = mode === 'spa'
        ? 'index.html'
        : url.endsWith('/')
          ? path.join(url, 'index.html')
          : url;

      if (fs.existsSync(path.join(outputDir, barePath))) {
        const contents = await fs.promises.readFile(path.join(outputDir, barePath), 'utf-8');

        ctx.set('content-type', 'text/html');
        ctx.body = contents;
      }
    }

    await next();
  });

  app.use(async (ctx, next) => {
    const url = ctx.request.url;

    if (compilation.config.devServer.proxy) {
      const proxyPlugin = compilation.config.plugins.filter((plugin) => {
        return plugin.name === 'plugin-dev-proxy';
      }).map((plugin) => {
        return plugin.provider(compilation);
      })[0];

      if (url !== '/' && await proxyPlugin.shouldServe(url)) {
        ctx.body = (await proxyPlugin.serve(url)).body;
      }
    }

    await next();
  });

  app.use(async (ctx, next) => {
    const responseAccumulator = {
      body: ctx.body,
      contentType: ctx.response.header['content-type']
    };

    const reducedResponse = await standardResources.reduce(async (responsePromise, resource) => {
      const response = await responsePromise;
      const url = ctx.url.replace(/\?(.*)/, '');
      const { headers } = ctx.response;
      const outputPathUrl = path.join(compilation.context.outputDir, url);
      const shouldServe = await resource.shouldServe(outputPathUrl, {
        request: ctx.headers,
        response: headers
      });

      if (shouldServe) {
        const resolvedResource = await resource.serve(outputPathUrl, {
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

    ctx.set('content-type', reducedResponse.contentType);
    ctx.body = reducedResponse.body;

    if (composable) {
      await next();
    }
  });
    
  return app;
}

async function getHybridServer(compilation) {
  const app = await getStaticServer(compilation, true);

  app.use(async (ctx) => {
    const { routesDir } = compilation.context;
    const { mode } = compilation.config;
    const url = ctx.request.url.replace(/\?(.*)/, ''); // get rid of things like query string parameters

    if (url.endsWith('/') && mode === 'ssr') {
      if (fs.existsSync(path.join(routesDir, `${url.replace(/\//g, '')}.js`))) {
        const standardHtmlResource = compilation.config.plugins.filter((plugin) => {
          // html is intentionally omitted
          return plugin.isGreenwoodDefaultPlugin
            && plugin.type === 'resource'
            && plugin.name.indexOf('plugin-standard-html') === 0;
        }).map((plugin) => {
          return plugin.provider(compilation);
        })[0];
        const response = await standardHtmlResource.serve(url);

        ctx.status = 200;
        ctx.set('content-type', response.contentType);
        ctx.body = response.body;
      }
    }
  });

  return app;
}

export { 
  getDevServer,
  getStaticServer,
  getHybridServer
};