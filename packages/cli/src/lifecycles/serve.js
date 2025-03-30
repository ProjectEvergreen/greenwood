// @ts-nocheck
import fs from "fs/promises";
import { hashString } from "../lib/hashing-utils.js";
import Koa from "koa";
import { koaBody } from "koa-body";
import {
  checkResourceExists,
  mergeResponse,
  transformKoaRequestIntoStandardRequest,
  requestAsObject,
} from "../lib/resource-utils.js";
import { Readable } from "stream";
import { Worker } from "worker_threads";

async function getDevServer(compilation) {
  const app = new Koa();
  const compilationCopy = Object.assign({}, compilation);
  const resourcePlugins = [
    // Greenwood default standard resource and import plugins
    ...compilation.config.plugins
      .filter((plugin) => {
        return plugin.type === "resource" && plugin.isGreenwoodDefaultPlugin;
      })
      .map((plugin) => {
        return plugin.provider(compilationCopy);
      }),

    // TODO with pre lifecycles, do we even need this distinction
    // custom user resource plugins
    ...compilation.config.plugins
      .filter((plugin) => {
        return plugin.type === "resource" && !plugin.isGreenwoodDefaultPlugin;
      })
      .map((plugin) => plugin.provider(compilationCopy)),
  ];

  app.use(koaBody());

  // resolve urls to `file://` paths if applicable, otherwise default is `http://`
  app.use(async (ctx, next) => {
    try {
      const url = new URL(`http://localhost:${compilation.config.port}${ctx.url}`);
      const initRequest = transformKoaRequestIntoStandardRequest(url, ctx.request);
      const request = await resourcePlugins.reduce(async (requestPromise, plugin) => {
        const intermediateRequest = await requestPromise;
        return plugin.shouldResolve &&
          (await plugin.shouldResolve(url, intermediateRequest.clone()))
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

  // allow pre-serving of userland plugins _before_ Greenwood "standardizes" it
  app.use(async (ctx, next) => {
    try {
      const url = new URL(ctx.url);
      const { header, status, message } = ctx.response;
      const request = transformKoaRequestIntoStandardRequest(url, ctx.request);
      const initResponse = new Response(ctx.body, {
        statusText: message,
        status,
        headers: new Headers(header),
      }).clone();
      const response = await resourcePlugins.reduce(async (responsePromise, plugin) => {
        const intermediateResponse = await responsePromise;
        if (
          plugin.shouldPreServe &&
          (await plugin.shouldPreServe(url, request, intermediateResponse.clone()))
        ) {
          const current = await plugin.preServe(url, request, await intermediateResponse.clone());
          const merged = mergeResponse(intermediateResponse.clone(), current.clone());

          return Promise.resolve(merged);
        } else {
          return Promise.resolve(await responsePromise);
        }
      }, Promise.resolve(initResponse.clone()));

      ctx.body = response.body ? Readable.from(response.body) : initResponse;
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

  // handle serving responses from urls
  app.use(async (ctx, next) => {
    try {
      const url = new URL(ctx.url);
      const { header, status, message } = ctx.response;
      const request = transformKoaRequestIntoStandardRequest(url, ctx.request);
      // intentionally ignore initial statusText to avoid false positives from 404s
      let response = new Response(status === 204 ? null : ctx.body, {
        statusText: message,
        status,
        headers: new Headers(header),
      }).clone();

      for (const plugin of resourcePlugins) {
        if (plugin.shouldServe && (await plugin.shouldServe(url, request, response.clone()))) {
          const current = await plugin.serve(url, request, response.clone());
          const merged = mergeResponse(response.clone(), current.clone());

          response = merged.clone();
        }
      }

      ctx.body = response.body ? Readable.from(response.body) : "";
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

  // allow pre-processing of userland plugins _before_ Greenwood "standardizes" it
  app.use(async (ctx, next) => {
    try {
      const url = new URL(ctx.url);
      const { header, status, message } = ctx.response;
      const request = transformKoaRequestIntoStandardRequest(url, ctx.request);
      const initResponse = new Response(status === 204 ? null : ctx.body, {
        statusText: message,
        status,
        headers: new Headers(header),
      });
      const response = await resourcePlugins.reduce(async (responsePromise, plugin) => {
        const intermediateResponse = await responsePromise;
        if (
          plugin.shouldPreIntercept &&
          (await plugin.shouldPreIntercept(url, request, intermediateResponse.clone()))
        ) {
          const current = await plugin.preIntercept(
            url,
            request,
            await intermediateResponse.clone(),
          );
          const merged = mergeResponse(intermediateResponse.clone(), current);

          return Promise.resolve(merged);
        } else {
          return Promise.resolve(await responsePromise);
        }
      }, Promise.resolve(initResponse.clone()));

      ctx.body = response.body ? Readable.from(response.body) : "";
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
        headers: new Headers(header),
      });
      const response = await resourcePlugins.reduce(async (responsePromise, plugin) => {
        const intermediateResponse = await responsePromise;
        if (
          plugin.shouldIntercept &&
          (await plugin.shouldIntercept(url, request, intermediateResponse.clone()))
        ) {
          const current = await plugin.intercept(url, request, await intermediateResponse.clone());
          const merged = mergeResponse(intermediateResponse.clone(), current);

          return Promise.resolve(merged);
        } else {
          return Promise.resolve(await responsePromise);
        }
      }, Promise.resolve(initResponse.clone()));

      ctx.body = response.body ? Readable.from(response.body) : "";
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
    if (process.env.__GWD_COMMAND__ === "develop" && url.protocol === "file:") {
      // there's probably a better way to do this with tee-ing streams but this works for now
      const { header, status, message } = ctx.response;
      const response = new Response(ctx.body, {
        statusText: message,
        status,
        headers: new Headers(header),
      }).clone();
      const splitResponse = response.clone();
      const contents = await splitResponse.text();
      const inm = ctx.headers["if-none-match"];
      const etagHash =
        url.pathname.split(".").pop() === "json"
          ? hashString(JSON.stringify(contents))
          : hashString(contents);

      if (inm && inm === etagHash) {
        ctx.status = 304;
        ctx.body = null;
        ctx.set("Etag", etagHash);
        ctx.set("Cache-Control", "no-cache");
      } else if (!inm || inm !== etagHash) {
        ctx.body = Readable.from(response.body);
        ctx.set("Etag", etagHash);
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
  const { port, basePath } = compilation.config;
  const standardResourcePlugins = compilation.config.plugins.filter((plugin) => {
    return plugin.type === "resource" && plugin.isGreenwoodDefaultPlugin;
  });

  app.use(async (ctx, next) => {
    try {
      const url = new URL(`http://localhost:${port}${ctx.url}`);
      const matchingRoute = compilation.graph.find((page) => page.route === url.pathname);
      const isSPA = compilation.graph.find((page) => page.isSPA);
      const { isSSR } = matchingRoute || {};
      const isStatic =
        (matchingRoute && !isSSR) ||
        (isSSR && compilation.config.prerender) ||
        (isSSR && matchingRoute.prerender);

      if (isSPA || (matchingRoute && isStatic) || url.pathname.split(".").pop() === "html") {
        const outputHref = isSPA
          ? isSPA.outputHref
          : isStatic
            ? matchingRoute.outputHref
            : new URL(`.${url.pathname.replace(basePath, "")}`, outputDir).href;
        const body = await fs.readFile(new URL(outputHref), "utf-8");

        ctx.set("Content-Type", "text/html");
        ctx.body = body;
      }
    } catch (e) {
      ctx.status = 500;
      console.error(e);
    }

    await next();
  });

  // TODO devServer.proxy is not really just for dev
  // should it be renamed?  should this be a middleware?
  app.use(async (ctx, next) => {
    try {
      const url = new URL(`http://localhost:${port}${ctx.url}`);
      const request = new Request(url, {
        method: ctx.request.method,
        headers: ctx.request.header,
      });

      if (compilation.config.devServer.proxy) {
        const proxyPlugin = standardResourcePlugins
          .find((plugin) => plugin.name === "plugin-dev-proxy")
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
      const url = new URL(`.${ctx.url.replace(basePath, "")}`, outputDir.href);

      if (await checkResourceExists(url)) {
        const resourcePlugins = standardResourcePlugins
          .filter((plugin) => plugin.isStandardStaticResource)
          .map((plugin) => {
            return plugin.provider(compilation);
          });

        const request = new Request(url.href, {
          headers: new Headers(ctx.request.header),
        });
        const initResponse = new Response(ctx.body, {
          status: ctx.response.status,
          headers: new Headers(ctx.response.header),
        });
        const response = await resourcePlugins.reduce(async (responsePromise, plugin) => {
          return plugin.shouldServe && (await plugin.shouldServe(url, request))
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
  const { graph, manifest, config } = compilation;
  const isolationMode = config.isolation;
  const app = await getStaticServer(compilation, true);

  app.use(koaBody());

  app.use(async (ctx) => {
    try {
      const url = new URL(`http://localhost:${config.port}${ctx.url}`);
      const matchingRoute = graph.find((node) => node.route === url.pathname) || { data: {} };
      const isApiRoute = manifest.apis.has(url.pathname);
      const request = transformKoaRequestIntoStandardRequest(url, ctx.request);

      if (!config.prerender && matchingRoute.isSSR && !matchingRoute.prerender) {
        const entryPointUrl = new URL(matchingRoute.outputHref);
        let html;

        if (matchingRoute.isolation || isolationMode) {
          // eslint-disable-next-line no-async-promise-executor
          await new Promise(async (resolve, reject) => {
            const worker = new Worker(
              new URL("../lib/ssr-route-worker-isolation-mode.js", import.meta.url),
            );
            // "faux" new Request here, a better way?
            const request = await requestAsObject(new Request(url));

            worker.on("message", async (result) => {
              html = result;

              resolve();
            });
            worker.on("error", reject);
            worker.on("exit", (code) => {
              if (code !== 0) {
                reject(new Error(`Worker stopped with exit code ${code}`));
              }
            });

            worker.postMessage({
              routeModuleUrl: entryPointUrl.href,
              request,
              compilation: JSON.stringify(compilation),
            });
          });
        } else {
          // @ts-expect-error see https://github.com/microsoft/TypeScript/issues/42866
          const { handler } = await import(entryPointUrl);
          const response = await handler(request, compilation);

          html = Readable.from(response.body);
        }

        ctx.body = html;
        ctx.set("Content-Type", "text/html");
        ctx.status = 200;
      } else if (isApiRoute) {
        const apiRoute = manifest.apis.get(url.pathname);
        const entryPointUrl = new URL(apiRoute.outputHref);
        let body, status, headers, statusText;

        if (apiRoute.isolation || isolationMode) {
          // eslint-disable-next-line no-async-promise-executor
          await new Promise(async (resolve, reject) => {
            const worker = new Worker(new URL("../lib/api-route-worker.js", import.meta.url));
            // "faux" new Request here, a better way?
            const req = await requestAsObject(request);

            worker.on("message", async (result) => {
              const responseAsObject = result;

              body = responseAsObject.body;
              status = responseAsObject.status;
              headers = new Headers(responseAsObject.headers);
              statusText = responseAsObject.statusText;

              resolve();
            });
            worker.on("error", reject);
            worker.on("exit", (code) => {
              if (code !== 0) {
                reject(new Error(`Worker stopped with exit code ${code}`));
              }
            });

            worker.postMessage({
              href: entryPointUrl.href,
              request: req,
            });
          });
        } else {
          // @ts-expect-error see https://github.com/microsoft/TypeScript/issues/42866
          const { handler } = await import(entryPointUrl);
          const response = await handler(request);

          body = response.body;
          status = response.status;
          headers = response.headers;
          statusText = response.statusText;
        }

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

export { getDevServer, getStaticServer, getHybridServer };
