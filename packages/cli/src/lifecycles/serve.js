import { BrowserRunner } from '../lib/browser.js';
import fs from 'fs';
import { hashString } from '../lib/hashing-utils.js';
import path from 'path';
import Koa from 'koa';
import { ResourceInterface } from '../lib/resource-interface.js';
import { getRollupConfig } from '../config/rollup.config.js';
import { rollup } from 'rollup';

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
  app.use(async (ctx, next) => {
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

    await next();
  });

  // ETag Support - https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag
  app.use(async (ctx) => {
    const body = ctx.response.body;
    const { url } = ctx;

    // don't interfere with extrenal requests or API calls
    if (path.extname(url) !== '' && url.indexOf('http') !== 0) {
      if (Buffer.isBuffer(body)) {
        // console.warn(`no body for => ${ctx.url}`);
      } else {
        const inm = ctx.headers['if-none-match'];
        const etagHash = hashString(body);

        if (inm && inm === etagHash) {
          ctx.status = 304;
          ctx.body = null;
          ctx.set('Etag', etagHash);
        } else if (!inm || inm !== etagHash) {
          ctx.set('Etag', etagHash);
        }
      }
    }

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
    const { outputDir, userWorkspace } = compilation.context;
    const url = ctx.request.url.replace(/\?(.*)/, ''); // get rid of things like query string parameters

    // only handle static output routes, eg. public/about.html
    if (url.endsWith('/') || url.endsWith('.html')) {
      const barePath = fs.existsSync(path.join(userWorkspace, 'index.html')) // SPA
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
  const { prerender } = compilation.config;
  let browserRunner;

  if (prerender) {
    browserRunner = new BrowserRunner();

    await browserRunner.init();
  }

  app.use(async (ctx) => {
    const url = ctx.request.url.replace(/\?(.*)/, ''); // get rid of things like query string parameters
    const matchingRoute = compilation.graph.filter((node) => {
      return node.route === url;
    })[0] || { data: {} };

    if (matchingRoute.isSSR) {
      const headers = {
        request: { 'accept': 'text/html', 'content-type': 'text/html' },
        response: { 'content-type': 'text/html' }
      };
      const standardHtmlResource = compilation.config.plugins.filter((plugin) => {
        return plugin.isGreenwoodDefaultPlugin
          && plugin.type === 'resource'
          && plugin.name.indexOf('plugin-standard-html') === 0;
      }).map((plugin) => {
        return plugin.provider(compilation);
      })[0];
      let body;

      const interceptResources = compilation.config.plugins.filter((plugin) => {
        return plugin.type === 'resource' && !plugin.isGreenwoodDefaultPlugin;
      }).map((plugin) => {
        return plugin.provider(compilation);
      }).filter((provider) => {
        return provider.shouldIntercept && provider.intercept;
      });

      body = (await standardHtmlResource.serve(url)).body;
      body = (await interceptResources.reduce(async (htmlPromise, resource) => {
        const html = (await htmlPromise).body;
        const shouldIntercept = await resource.shouldIntercept(url, html, headers);

        return shouldIntercept
          ? resource.intercept(url, html, headers)
          : htmlPromise;
      }, Promise.resolve({ url, body }))).body;

      const optimizeResources = compilation.config.plugins.filter((plugin) => {
        return plugin.type === 'resource';
      }).map((plugin) => {
        return plugin.provider(compilation);
      }).filter((provider) => {
        return provider.shouldOptimize && provider.optimize;
      });

      body = await optimizeResources.reduce(async (htmlPromise, resource) => {
        const html = await htmlPromise;
        const shouldOptimize = await resource.shouldOptimize(url, html, headers);

        return shouldOptimize
          ? resource.optimize(url, html, headers)
          : Promise.resolve(html);
      }, Promise.resolve(body));

      await fs.promises.mkdir(path.join(compilation.context.scratchDir, url), { recursive: true });
      await fs.promises.writeFile(path.join(compilation.context.scratchDir, url, 'index.html'), body);

      compilation.graph = compilation.graph.filter(page => page.isSSR && page.route === url);

      const rollupConfigs = await getRollupConfig(compilation);
      const bundle = await rollup(rollupConfigs[0]);
      await bundle.write(rollupConfigs[0].output);

      body = await fs.promises.readFile(path.join(compilation.context.outputDir, url, 'index.html'), 'utf-8');

      ctx.status = 200;
      ctx.set('content-type', 'text/html');
      ctx.body = body;
    }
  });

  return app;
}

export { 
  getDevServer,
  getStaticServer,
  getHybridServer
};