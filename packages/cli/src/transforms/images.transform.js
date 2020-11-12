const { promises: fsp } = require('fs');
const path = require('path');

module.exports = filterAssets = async (ctx, userWorkspace) => {
  return new Promise(async (resolve, reject) => {
    try {
      // TODO break up into distinct font / icons / svg handlers, not related to assets/
      if (ctx.request.url.indexOf('assets/') >= 0 && ctx.request.url.indexOf('.css') < 0) {
        const assetPath = path.join(userWorkspace, ctx.request.url);
        const ext = path.extname(assetPath);
        const type = ext === '.svg'
          ? `${ext.replace('.', '')}+xml`
          : ext.replace('.', '');

        // console.debug('assetPath', assetPath);
        // console.debug('asset ext', ext);

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
        } else {
          ctx.set('Content-Type', `text/${type}`);
          ctx.body = await fsp.readFile(assetPath, 'utf-8');
        }
      }
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};