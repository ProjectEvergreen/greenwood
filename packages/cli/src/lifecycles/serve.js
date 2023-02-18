import fs from 'fs/promises';
import { hashString } from '../lib/hashing-utils.js';
import Koa from 'koa';
import { mergeResponse } from '../lib/resource-utils.js';
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
      const initRequest = new Request(url, {
        method: ctx.request.method,
        headers: new Headers(ctx.request.header)
      });
      const request = await resourcePlugins.reduce(async (requestPromise, plugin) => {
        const intermediateRequest = await requestPromise;
        return plugin.shouldResolve && await plugin.shouldResolve(url, intermediateRequest.clone())
          ? Promise.resolve(await plugin.resolve(url, intermediateRequest.clone()))
          : Promise.resolve(await requestPromise);
      }, Promise.resolve(initRequest));

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
      const { method, header } = ctx.request;
      const { status } = ctx.response;
      const request = new Request(url.href, { method, headers: new Headers(header) });
      let response = new Response(null, { status });

      for (const plugin of resourcePlugins) {
        if (plugin.shouldServe && await plugin.shouldServe(url, request)) {
          response = await plugin.serve(url, request);
          break;
        }
      }

      ctx.body = response.body ? Readable.from(response.body) : '';
      ctx.type = response.headers.get('Content-Type');
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
        headers: new Headers(ctx.request.header)
      });
      const initResponse = new Response(ctx.body, {
        status: ctx.response.status,
        headers: new Headers(ctx.response.header)
      });
      const response = await resourcePlugins.reduce(async (responsePromise, plugin) => {
        const intermediateResponse = await responsePromise;
        if (plugin.shouldIntercept && await plugin.shouldIntercept(url, request, intermediateResponse.clone())) {
          const current = await plugin.intercept(url, request, await intermediateResponse.clone());
          const merged = mergeResponse(intermediateResponse.clone(), current);

          return Promise.resolve(merged);
        } else {
          return Promise.resolve(await responsePromise);
        }
      }, Promise.resolve(initResponse.clone()));

      ctx.body = response.body ? Readable.from(response.body) : '';
      ctx.set('Content-Type', response.headers.get('Content-Type'));
    } catch (e) {
      ctx.status = 500;
      console.error(e);
    }
  
    await next();
  });

  // ETag Support - https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag
  // https://stackoverflow.com/questions/43659756/chrome-ignores-the-etag-header-and-just-uses-the-in-memory-cache-disk-cache
  app.use(async (ctx) => {
    const body = ctx.response.body;
    const url = new URL(ctx.url);

    // don't interfere with external requests or API calls, binary files, or JSON
    // and only run in development
    if (process.env.__GWD_COMMAND__ === 'develop' && url.protocol === 'file:') { // eslint-disable-line no-underscore-dangle
      if (!body || Buffer.isBuffer(body)) {
        // console.warn(`no body for => ${ctx.url}`);
      } else {
        const inm = ctx.headers['if-none-match'];
        const etagHash = url.pathname.split('.').pop() === 'json'
          ? hashString(JSON.stringify(body))
          : hashString(body);

        if (inm && inm === etagHash) {
          ctx.status = 304;
          ctx.body = null;
          ctx.set('Etag', etagHash);
          ctx.set('Cache-Control', 'no-cache');
        } else if (!inm || inm !== etagHash) {
          ctx.set('Etag', etagHash);
        }
      }
    }
  });

  return app;
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
    try {
      const url = new URL(`http://localhost:8080${ctx.url}`);
      const matchingRoute = compilation.graph.find(page => page.route === url.pathname);
      const isSPA = compilation.graph.find(page => page.isSPA);

      if (isSPA || (matchingRoute && !matchingRoute.isSSR) || url.pathname.split('.').pop() === 'html') {
        const pathname = isSPA
          ? 'index.html'
          : matchingRoute
            ? matchingRoute.outputPath
            : url.pathname;
        const body = await fs.readFile(new URL(`./${pathname}`, outputDir), 'utf-8');

        ctx.set('Content-Type', 'text/html');
        ctx.body = body;
      }
    } catch (e) {
      ctx.status = 500;
      console.error(e);
    }

    await next();
  });

  app.use(async (ctx, next) => {
    try {
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
          ctx.set('Content-Type', response.headers.get('Content-Type'));
        }
      }
    } catch (e) {
      ctx.status = 500;
      console.error(e);
    }

    await next();
  });

  app.use(async (ctx, next) => {
    try {
      const url = new URL(`.${ctx.url}`, outputDir.href);
      const resourcePlugins = standardResourcePlugins.map((plugin) => {
        return plugin.provider(compilation);
      });

      const request = new Request(url.href);
      const initResponse = new Response(ctx.body, {
        status: ctx.response.status,
        headers: new Headers(ctx.response.header)
      });
      const response = await resourcePlugins.reduce(async (responsePromise, plugin) => {
        return plugin.shouldServe && await plugin.shouldServe(url, request)
          ? Promise.resolve(await plugin.serve(url, request))
          : responsePromise;
      }, Promise.resolve(initResponse));

      if (response.ok) {
        ctx.body = Readable.from(response.body);
        ctx.type = response.headers.get('Content-Type');
        ctx.status = response.status;
      }
    } catch (e) {
      ctx.status = 500;
      console.error(e);
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
    try {
      const url = new URL(`http://localhost:8080${ctx.url}`);
      const isApiRoute = url.pathname.startsWith('/api');
      const matchingRoute = compilation.graph.find((node) => node.route === url.pathname) || { data: {} };
      const request = new Request(url.href, {
        method: ctx.request.method,
        headers: ctx.request.header
      });

      if (matchingRoute.isSSR && !matchingRoute.data.static) {
        const standardHtmlResource = resourcePlugins.find((plugin) => {
          return plugin.isGreenwoodDefaultPlugin
            && plugin.name.indexOf('plugin-standard-html') === 0;
        }).provider(compilation);
        let response = await standardHtmlResource.serve(url, request);

        response = await standardHtmlResource.optimize(url, response);

        ctx.body = Readable.from(response.body);
        ctx.set('Content-Type', 'text/html');
        ctx.status = 200;
      } else if (isApiRoute) {
        const apiResource = resourcePlugins.find((plugin) => {
          return plugin.isGreenwoodDefaultPlugin
            && plugin.name === 'plugin-api-routes';
        }).provider(compilation);
        const response = await apiResource.serve(url, request);

        ctx.status = 200;
        ctx.set('Content-Type', response.headers.get('Content-Type'));
        ctx.body = Readable.from(response.body);
      }
    } catch (e) {
      ctx.status = 500;
      console.error(e);
    }
  });

  return app;
}

export { 
  getDevServer,
  getStaticServer,
  getHybridServer
};