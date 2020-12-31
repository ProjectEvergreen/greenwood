/* eslint-disable complexity */
// TODO ^^^
const { promises: fsp } = require('fs');
const path = require('path');
const Koa = require('koa');

const Transform = require('../transforms/transform.interface');
const HTMLTransform = require('../transforms/transform.html');
const MarkdownTransform = require('../transforms/transform.md');
const CSSTransform = require('../transforms/transform.css');
const JSTransform = require('../transforms/transform.js');
const JSONTransform = require('../transforms/transform.json.js');
const AssetTransform = require('../transforms/transform.assets');

function getDevServer(compilation) {
  const app = new Koa();

  app.use(async ctx => {
    let response = {
      body: '',
      contentType: '',
      extension: ''
    };

    request = {
      header: ctx.request.header,
      url: ctx.request.url,
      compilation: { ...compilation }
    };

    try {
      // default transforms 
      const defaultTransforms = [
        new HTMLTransform(request),
        new MarkdownTransform(request),
        new CSSTransform(request),
        new JSTransform(request),
        new JSONTransform(request),
        new AssetTransform(request)
      ];

      // walk through all transforms
      await Promise.all(defaultTransforms.map(async (plugin) => {
        if (plugin instanceof Transform && plugin.shouldTransform()) {

          const transformedResponse = await plugin.applyTransform();

          response = { 
            ...transformedResponse
          };
        }
      }));

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

    if (ctx.request.url.endsWith('/')) {
      const contents = await fsp.readFile(path.join(outputDir, ctx.request.url, 'index.html'), 'utf-8');
      ctx.set('Content-Type', 'text/html');
      ctx.body = contents;
    }

    if (ctx.request.url.endsWith('.html')) {
      const contents = await fsp.readFile(path.join(outputDir, ctx.request.url), 'utf-8'));

      ctx.set('Content-Type', 'text/html');
      ctx.body = contents;
    }

    if (ctx.request.url.endsWith('.js')) {
      const contents = await fsp.readFile(path.join(outputDir, ctx.request.url), 'utf-8');

      ctx.set('Content-Type', 'text/javascript');
      ctx.body = contents;
    }

    if (ctx.request.url.endsWith('.css')) {
      const contents = await fsp.readFile(path.join(outputDir, ctx.request.url), 'utf-8');

      ctx.set('Content-Type', 'text/css');
      ctx.body = contents;
    }

    // TODO break up into distinct font / icons / svg handlers, decouple from to assets/
    if (ctx.request.url.indexOf('assets/')) {
      const assetPath = path.join(outputDir, ctx.request.url);
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

    if (ctx.request.url.endsWith('.json')) {
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