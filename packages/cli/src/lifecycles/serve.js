/* eslint-disable complexity */
// TODO ^^^
const { promises: fsp } = require('fs');
const path = require('path');
const Koa = require('koa');

const filterHTML = require('../transforms/html.transform');
const filterModule = require('../transforms/node-modules.transform');
const filterCSS = require('../transforms/css.transform');
const filterJavascript = require('../transforms/js.transform');
const filterJSON = require('../transforms/json.transform');
const filterImages = require('../transforms/images.transform');

function getDevServer(compilation) {
  const app = new Koa();

  // TODO use url.endsWith!!
  // eslint-disable-next-line no-unused-vars
  app.use(async ctxKoa => {
    // console.debug('URL', ctx.url);
    const { config, context } = compilation;
    const { userWorkspace } = context;

    let ctx = getContextAPI(ctxKoa);

    try {
      await filterHTML(ctx, config, userWorkspace);
      await filterModule(ctx);
      await filterJSON(ctx, context);
      await filterJavascript(ctx, userWorkspace);
      await filterCSS(ctx, userWorkspace);
      await filterImages(ctx, userWorkspace);
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

function getContextAPI(ctx) {
  const { header, url } = ctx.request;

  return {
    body: (contents) => ctx.body = contents,
    set: (name, value) => ctx.set(name, value),
    url,
    header,
    redirect: (url) => ctx.redirect(url)
  };
}

module.exports = {
  devServer: getDevServer,
  prodServer: getProdServer
};