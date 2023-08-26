import fs from 'fs/promises';
import { hashString } from '../lib/hashing-utils.js';
import Koa from 'koa';
import { koaBody } from 'koa-body';
import { checkResourceExists, mergeResponse, transformKoaRequestIntoStandardRequest } from '../lib/resource-utils.js';
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

  app.use(koaBody());

  // resolve urls to `file://` paths if applicable, otherwise default is `http://`
  app.use(async (ctx, next) => {
    try {
      const url = new URL(`http://localhost:${compilation.config.port}${ctx.url}`);
      const initRequest = transformKoaRequestIntoStandardRequest(url, ctx.request);
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
      const { status } = ctx.response;
      const request = transformKoaRequestIntoStandardRequest(url, ctx.request);
      // intentionally ignore initial statusText to avoid false positives from 404s
      let response = new Response(null, { status });

      for (const plugin of resourcePlugins) {
        if (plugin.shouldServe && await plugin.shouldServe(url, request)) {
          const current = await plugin.serve(url, request);
          const merged = mergeResponse(response.clone(), current.clone());

          response = merged;
          break;
        }
      }

      ctx.body = response.body ? Readable.from(response.body) : '';
      ctx.status = response.status;
      ctx.message = response.statusText;
      response.headers.forEach((value, key) => {
        ctx.set(key, value);
      });
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
      const { header, status, message } = ctx.response;
      const request = transformKoaRequestIntoStandardRequest(url, ctx.request);
      const initResponse = new Response(status === 204 ? null : ctx.body, {
        statusText: message,
        status,
        headers: new Headers(header)
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
      ctx.message = response.statusText;
      response.headers.forEach((value, key) => {
        ctx.set(key, value);
      });
    } catch (e) {
      ctx.status = 500;
      console.error(e);
    }

    await next();
  });

  // ETag Support - https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag
  // https://stackoverflow.com/questions/43659756/chrome-ignores-the-etag-header-and-just-uses-the-in-memory-cache-disk-cache
  app.use(async (ctx) => {
    const url = new URL(ctx.url);

    // don't interfere with external requests or API calls, only files
    // and only run in development
    if (process.env.__GWD_COMMAND__ === 'develop' && url.protocol === 'file:') { // eslint-disable-line no-underscore-dangle
      // TODO there's probably a better way to do this with tee-ing streams but this works for now
      const { header, status, message } = ctx.response;
      const response = new Response(ctx.body, {
        statusText: message,
        status,
        headers: new Headers(header)
      }).clone();
      const splitResponse = response.clone();
      const contents = await splitResponse.text();
      const inm = ctx.headers['if-none-match'];
      const etagHash = url.pathname.split('.').pop() === 'json'
        ? hashString(JSON.stringify(contents))
        : hashString(contents);

      if (inm && inm === etagHash) {
        ctx.status = 304;
        ctx.body = null;
        ctx.set('Etag', etagHash);
        ctx.set('Cache-Control', 'no-cache');
      } else if (!inm || inm !== etagHash) {
        ctx.body = Readable.from(response.body);
        ctx.status = ctx.status;
        ctx.set('Etag', etagHash);
        ctx.message = response.statusText;
        response.headers.forEach((value, key) => {
          ctx.set(key, value);
        });
      }
    }
  });

  return app;
}

async function getStaticServer(compilation, composable) {
  const app = new Koa();
  const { outputDir } = compilation.context;
  const { port } = compilation.config;
  const standardResourcePlugins = compilation.config.plugins.filter((plugin) => {
    return plugin.type === 'resource' && plugin.isGreenwoodDefaultPlugin;
  });

  app.use(async (ctx, next) => {
    try {
      const url = new URL(`http://localhost:${port}${ctx.url}`);
      const matchingRoute = compilation.graph.find(page => page.route === url.pathname);
      const isSPA = compilation.graph.find(page => page.isSPA);
      const { isSSR } = matchingRoute || {};
      const isStatic = matchingRoute && !isSSR || isSSR && compilation.config.prerender || isSSR && matchingRoute.data.static;

      if (isSPA || (matchingRoute && isStatic) || url.pathname.split('.').pop() === 'html') {
        const pathname = isSPA
          ? 'index.html'
          : isStatic
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
      const url = new URL(`http://localhost:${port}${ctx.url}`);
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
          response.headers.forEach((value, key) => {
            ctx.set(key, value);
          });
          ctx.message = response.statusText;
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

      if (await checkResourceExists(url)) {
        const resourcePlugins = standardResourcePlugins
          .filter((plugin) => plugin.isStandardStaticResource)
          .map((plugin) => {
            return plugin.provider(compilation);
          });

        const request = new Request(url.href, {
          headers: new Headers(ctx.request.header)
        });
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
          ctx.status = response.status;
          ctx.message = response.statusText;
          response.headers.forEach((value, key) => {
            ctx.set(key, value);
          });
        }
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
  const { graph, manifest, context, config } = compilation;
  const { outputDir } = context;
  const app = await getStaticServer(compilation, true);

  app.use(koaBody());

  app.use(async (ctx) => {
    try {
      const url = new URL(`http://localhost:${config.port}${ctx.url}`);
      const matchingRoute = graph.find((node) => node.route === url.pathname) || { data: {} };
      const isApiRoute = manifest.apis.has(url.pathname);
      const request = transformKoaRequestIntoStandardRequest(url, ctx.request);

      if (!config.prerender && matchingRoute.isSSR && !matchingRoute.data.static) {
        const { handler } = await import(new URL(`./__${matchingRoute.filename}`, outputDir));
        // TODO passing compilation this way too hacky?
        const response = await handler(request, compilation);

        ctx.body = Readable.from(response.body);
        ctx.set('Content-Type', 'text/html');
        ctx.status = 200;
      } else if (isApiRoute) {
        const apiRoute = manifest.apis.get(url.pathname);
        const { handler } = await import(new URL(`.${apiRoute.path}`, outputDir));
        const response = await handler(request);
        const { body, status, headers, statusText } = response;

        ctx.body = body ? Readable.from(body) : null;
        ctx.status = status;
        ctx.message = statusText;

        headers.forEach((value, key) => {
          ctx.set(key, value);
        });
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