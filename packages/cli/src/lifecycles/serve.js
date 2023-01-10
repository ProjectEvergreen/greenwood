import fs from 'fs';
// import { hashString } from '../lib/hashing-utils.js';
import Koa from 'koa';
import { Readable } from 'stream';
import { ResourceInterface } from '../lib/resource-interface.js';

async function getDevServer(compilation) {
  const app = new Koa();
  const compilationCopy = Object.assign({}, compilation);
  const resourcePlugins = [
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

  // resolve urls to `file://` paths if applicable, otherwise default is `http://`
  app.use(async (ctx, next) => {
    try {
      const url = new URL(`http://localhost:${compilation.config.port}${ctx.url}`);

      let request = new Request(url, {
        method: ctx.request.method,
        headers: ctx.request.header
      });
      
      for (const plugin of resourcePlugins) {
        if (plugin.shouldResolve && await plugin.shouldResolve(url, request)) {
          request = await plugin.resolve(url, request);
        }
      }

      ctx.url = request.url;
    } catch (e) {
      ctx.status = 500;
      console.error(e);
    }

    await next();
  });

  // handle creating responses from urls
  app.use(async (ctx, next) => {
    try {
      const url = new URL(ctx.url);
      const request = new Request(url.href, {
        method: ctx.request.method,
        headers: ctx.request.header
      });
      let response = new Response(null, {
        status: ctx.response.status,
        headers: new Headers()
      });

      for (const plugin of resourcePlugins) {
        if (plugin.shouldServe && await plugin.shouldServe(url, request)) {
          response = await plugin.serve(url, request);
        }
      }

      // TODO would be nice if Koa (or other framework) could just a Response object directly
      // not sure why we have to use `Readable.from`, does this couple us to NodeJS?
      ctx.body = response.body ? Readable.from(response.body) : '';
      ctx.type = response.headers.get('content-type');
      ctx.status = response.status;
    } catch (e) {
      ctx.status = 500;
      console.error(e);
    }

    await next();
  });

  // allow intercepting of responses for URLs
  app.use(async (ctx, next) => {
    try {
      const url = new URL(ctx.url);
      const request = new Request(url, {
        method: ctx.request.method,
        headers: ctx.request.header
      });
      let response = new Response(ctx.body, {
        status: ctx.response.status,
        headers: ctx.response.header
      });

      for (const plugin of resourcePlugins) {
        if (plugin.shouldIntercept && await plugin.shouldIntercept(url, request, response)) {
          response = await plugin.intercept(url, request, response);
        }
      }

      // TODO would be nice if Koa (or other framework) could just a Response object directly
      // not sure why we have to use `Readable.from`, does this couple us to NodeJS?
      ctx.body = response.body ? Readable.from(response.body) : '';
      ctx.set('Content-Type', response.headers.get('content-type'));
    } catch (e) {
      ctx.status = 500;
      console.error(e);
    }
  
    await next();
  });

  // ETag Support - https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag
  // https://stackoverflow.com/questions/43659756/chrome-ignores-the-etag-header-and-just-uses-the-in-memory-cache-disk-cache
  // app.use(async (ctx) => {
  //   const body = ctx.response.body;
  //   const { url } = ctx;

  //   // don't interfere with external requests or API calls, binary files, or JSON
  //   // and only run in development
  //   if (process.env.__GWD_COMMAND__ === 'develop' && path.extname(url) !== '' && url.indexOf('http') !== 0) { // eslint-disable-line no-underscore-dangle
  //     if (!body || Buffer.isBuffer(body)) {
  //       // console.warn(`no body for => ${ctx.url}`);
  //     } else {
  //       const inm = ctx.headers['if-none-match'];
  //       const etagHash = path.extname(ctx.request.headers.originalUrl) === '.json'
  //         ? hashString(JSON.stringify(body))
  //         : hashString(body);

  //       if (inm && inm === etagHash) {
  //         ctx.status = 304;
  //         ctx.body = null;
  //         ctx.set('Etag', etagHash);
  //         ctx.set('Cache-Control', 'no-cache');
  //       } else if (!inm || inm !== etagHash) {
  //         ctx.set('Etag', etagHash);
  //       }
  //     }
  //   }

  // });

  return Promise.resolve(app);
}

async function getStaticServer(compilation, composable) {
  const app = new Koa();
  const { outputDir } = compilation.context;
  const standardResourcePlugins = compilation.config.plugins.filter((plugin) => {
    return plugin.type === 'resource'
      && plugin.isGreenwoodDefaultPlugin
      && plugin.name !== 'plugin-standard-html';
  });

  app.use(async (ctx, next) => {
    const url = new URL(`http://localhost:8080${ctx.url}`);
    const matchingRoute = compilation.graph.find(page => page.route === url.pathname);

    if ((matchingRoute && !matchingRoute.isSSR) || url.pathname.split('.').pop() === 'html') {
      const pathname = matchingRoute ? matchingRoute.outputPath : url.pathname;
      const body = await fs.promises.readFile(new URL(`./${pathname}`, outputDir), 'utf-8');

      ctx.set('content-type', 'text/html');
      ctx.body = body;
    }

    await next();
  });

  app.use(async (ctx, next) => {
    const url = new URL(`http://localhost:8080${ctx.url}`);
    const request = new Request(url, {
      method: ctx.request.method,
      headers: ctx.request.header
    });

    if (compilation.config.devServer.proxy) {
      const proxyPlugin = standardResourcePlugins
        .find((plugin) => plugin.name === 'plugin-dev-proxy')
        .provider(compilation);

      if (await proxyPlugin.shouldServe(url, request)) {
        const response = await proxyPlugin.serve(url, request);

        ctx.body = Readable.from(response.body);
        ctx.set('content-type', response.headers.get('content-type'));
      }
    }

    await next();
  });

  app.use(async (ctx, next) => {
    const url = new URL(`.${ctx.url}`, outputDir.href);
    const resourcePlugins = standardResourcePlugins.map((plugin) => {
      return plugin.provider(compilation);
    });
    const request = new Request(url.href);
    let response = null;

    for (const plugin of resourcePlugins) {
      if (plugin.shouldServe && await plugin.shouldServe(url, request)) {
        response = await plugin.serve(url, request);
      }
    }

    if (response) {
      ctx.body = Readable.from(response.body);
      ctx.type = response.headers.get('content-type');
      ctx.status = response.status;
    }

    if (composable) {
      await next();
    }
  });
    
  return app;
}

async function getHybridServer(compilation) {
  const app = await getStaticServer(compilation, true);
  const resourcePlugins = compilation.config.plugins.filter((plugin) => {
    return plugin.type === 'resource';
  });

  app.use(async (ctx) => {
    const url = new URL(`http://localhost:8080${ctx.url}`);
    const isApiRoute = url.pathname.startsWith('/api');
    const matchingRoute = compilation.graph.find((node) => node.route === url.pathname) || { data: {} };
    const request = new Request(url.href, {
      method: ctx.request.method,
      headers: ctx.request.header
    });

    console.debug('0000', { matchingRoute, isApiRoute });
    if (matchingRoute.isSSR && !matchingRoute.data.static) {
      const standardHtmlResource = resourcePlugins.find((plugin) => {
        return plugin.isGreenwoodDefaultPlugin
          && plugin.name.indexOf('plugin-standard-html') === 0;
      }).provider(compilation);
      let response = await standardHtmlResource.serve(url, request);

      for (const plugin of resourcePlugins) {
        if (plugin.shouldIntercept && await plugin.shouldIntercept(url, request, response)) {
          response = await plugin.intercept(url, request, response);
        }
      }

      response = await standardHtmlResource.optimize(url, response);

      for (const plugin of resourcePlugins) {
        if (plugin.shouldIntercept && await plugin.shouldIntercept(url, request, response)) {
          response = await plugin.intercept(url, request, response);
        }
      }

      ctx.body = Readable.from(response.body);
      ctx.set('content-type', 'text/html');
      ctx.status = 200;
    } else if (isApiRoute) {
      const apiResource = resourcePlugins.find((plugin) => {
        return plugin.isGreenwoodDefaultPlugin
          && plugin.name === 'plugin-api-routes';
      }).provider(compilation);
      const response = await apiResource.serve(url, request);

      ctx.status = 200;
      ctx.set('content-type', response.headers.get('content-type'));
      ctx.body = Readable.from(response.body);
    }
  });

  return app;
}

export { 
  getDevServer,
  getStaticServer,
  getHybridServer
};