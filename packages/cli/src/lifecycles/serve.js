/* eslint-disable complexity */
// TODO ^^^
const { promises: fsp } = require('fs');
const path = require('path');
const Koa = require('koa');

const Transform = require('../transforms/transform.interface');
const HTMLTransform = require('../transforms/transform.html');
const CSSTransform = require('../transforms/transform.css');
const JSTransform = require('../transforms/transform.js');
const NodeTransform = require('../transforms/transform.node');
const AssetTransform = require('../transforms/transform.assets');

function getDevServer(compilation) {
  const app = new Koa();

  app.use(async ctx => {
    let response = {
      body: '',
      contentType: '',
      extension: ''
    };

    let request = {
      header: ctx.request.header,
      url: ctx.request.url
    };

    try {
      // default transforms 
      const defaultTransforms = [
        new HTMLTransform(request, compilation),
        new CSSTransform(request, compilation),
        new NodeTransform(request, compilation),
        new JSTransform(request, compilation),
        new AssetTransform(request, compilation)
      ];
      
      // custom greenwood configured transform plugins
      const transformPlugins = compilation.config.plugins.filter(plugin => plugin.type === 'transform') || [];

      // combine arrays and remove duplicates
      const allTransforms = defaultTransforms.concat(transformPlugins.filter(({ extension }) => 
        defaultTransforms.extension.indexOf(extension) < 0));

      // walk through all transforms
      await Promise.all(allTransforms.map(async (plugin) => {
        if (plugin instanceof Transform && plugin.shouldTransform()) {

          const transformedResponse = await plugin.applyTransform();

          response = { 
            ...transformedResponse
          };
        }
      }));

      ctx.set('Content-Type', `${response.contentType}`);
      ctx.body = response.body;
      // etc
    } catch (err) {
      console.log(err);
    }
  });

  return app;
}

function getProdServer(compilation) {
  const app = new Koa();

  app.use(async ctxKoa => {
    // console.debug('URL', ctx.url);
    const { outputDir } = compilation.context;
    let ctx = getContextAPI(ctxKoa);

    if (ctx.url.endsWith('/')) {
      ctx.redirect(`http://localhost:8080${ctx.url}index.html`);
    }

    if (ctx.url.endsWith('.html')) {
      const contents = await fsp.readFile(path.join(outputDir, ctx.url), 'utf-8');

      ctx.set('Content-Type', 'text/html');
      ctx.body(contents);
    }

    if (ctx.url.endsWith('.js')) {
      const contents = await fsp.readFile(path.join(outputDir, ctx.url), 'utf-8');

      ctx.set('Content-Type', 'text/javascript');
      ctx.body(contents);
    }

    if (ctx.url.endsWith('.css')) {
      const contents = await fsp.readFile(path.join(outputDir, ctx.url), 'utf-8');

      ctx.set('Content-Type', 'text/css');
      ctx.body(contents);
    }

    // TODO break up into distinct font / icons / svg handlers, decouple from to assets/
    if (ctx.url.indexOf('assets/')) {
      const assetPath = path.join(outputDir, ctx.url);
      const ext = path.extname(assetPath);
      const type = ext === '.svg'
        ? `${ext.replace('.', '')}+xml`
        : ext.replace('.', '');

      if (['.jpg', '.png', '.gif', '.svg'].includes(ext)) {
        ctx.set('Content-Type', `image/${type}`);

        if (ext === '.svg') {
          ctx.body(await fsp.readFile(assetPath, 'utf-8'));
        } else {
          ctx.body(await fsp.readFile(assetPath)); 
        }
      } else if (['.woff2', '.woff', '.ttf'].includes(ext)) {
        ctx.set('Content-Type', `font/${type}`);
        ctx.body(await fsp.readFile(assetPath));
      } else if (['.ico'].includes(ext)) {
        ctx.set('Content-Type', 'image/x-icon');
        ctx.body(await fsp.readFile(assetPath));
      }
    }

    if (ctx.url.endsWith('.json')) {
      const contents = await fsp.readFile(path.join(outputDir, 'graph.json'), 'utf-8');

      ctx.set('Content-Type', 'application/json');
      ctx.body(JSON.parse(contents));
    }
  });
    
  return app;
}

module.exports = {
  devServer: getDevServer,
  prodServer: getProdServer
};