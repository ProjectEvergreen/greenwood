const { promises: fsp } = require('fs');
const path = require('path');
const Koa = require('koa');

const pluginResourceStandardHtml = require('../plugins/resource/plugin-standard-html');
const { ResourceInterface } = require('../lib/resource-interface');

// const Transform = require('../transforms/transform.interface');
// const HTMLTransform = require('../transforms/transform.html');
// const MarkdownTransform = require('../transforms/transform.md');
// const CSSTransform = require('../transforms/transform.css');
// const JSTransform = require('../transforms/transform.js');
// const JSONTransform = require('../transforms/transform.json.js');
// const AssetTransform = require('../transforms/transform.assets');
//
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

  app.use(async ctx => {
    console.debug(`MAKING REQUEST FOR => ${ctx.request.url}`);
    let response = {
      body: '',
      contentType: ''
    };

    // TODO prune
    const requestCopy = ctx.request;

    const compilationCopy = {
      ...compilation
    };

    const userResourcePlugins = compilation.config.plugins.filter((plugin) => { 
      return plugin.type === 'resource';
    }).map((plugin) => {
      return plugin.provider(compilationCopy);
    });

    try {
      // TODO share these accross requests
      // default resources to serve web standards, e.g. html (+ md), js, css
      const resources = [
        pluginResourceStandardHtml.provider(compilationCopy),
        // new HTMLTransform(request),
        // new MarkdownTransform(request),
        // new CSSTransform(request),
        // new JSTransform(request),
        // new JSONTransform(request),
        // new AssetTransform(request)
        ...userResourcePlugins
      ];

      const reducedResponse = resources.reduce((response = {}, resource) => {
        if (resource instanceof ResourceInterface && resource.shouldResolve(requestCopy)) {
          return {
            ...response,
            ...resource.resolve(requestCopy)
          };
        } else {
          return response;
        }
      }, response);

      response = {
        ...response,
        ...reducedResponse
      };

      ctx.set('Content-Type', `${response.contentType}`);
      ctx.body = response.body;
    } catch (err) {
      console.log(err);
    }
  });

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
      const contents = await fsp.readFile(path.join(outputDir, barePath), 'utf-8');
      ctx.set('Content-Type', 'text/html');
      ctx.body = contents;
    }

    if (url.endsWith('.js')) {
      const contents = await fsp.readFile(path.join(outputDir, url), 'utf-8');

      ctx.set('Content-Type', 'text/javascript');
      ctx.body = contents;
    }

    if (url.endsWith('.css')) {
      const contents = await fsp.readFile(path.join(outputDir, url), 'utf-8');

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
          ctx.body = await fsp.readFile(assetPath, 'utf-8');
        } else {
          ctx.body = await fsp.readFile(assetPath); 
        }
      } else if (['.woff2', '.woff', '.ttf'].includes(ext)) {
        ctx.set('Content-Type', `font/${type}`);
        ctx.body = await fsp.readFile(assetPath);
      } else if (['.ico'].includes(ext)) {
        ctx.set('Content-Type', 'image/x-icon');
        ctx.body = await fsp.readFile(assetPath);
      }
    }

    if (url.endsWith('.json')) {
      const contents = await fsp.readFile(path.join(outputDir, 'graph.json'), 'utf-8');

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