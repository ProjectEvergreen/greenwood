const path = require('path');
const { promises: fsp } = require('fs');

module.exports = filterStyles = async (ctx, userWorkspace) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (ctx.request.url.indexOf('.css') >= 0) {
        const destHeader = ctx.request.header['sec-fetch-dest'];
        const cssPath = ctx.request.url.indexOf('/node_modules') >= 0
          ? path.join(process.cwd(), ctx.request.url)
          : path.join(userWorkspace, ctx.request.url);
        const css = await fsp.readFile(cssPath, 'utf-8');

        // <style> tag used
        if (destHeader === 'style') {
          ctx.set('Content-Type', 'text/css');
          ctx.body = css;
        } else if (destHeader === 'empty') {
          // assume JS import being being used
          ctx.set('Content-Type', 'text/javascript');
          // TODO line breaks are bad for fetch, need to return CSS string all on one line
          ctx.body = `
            const css = "${css.replace(/\r?\n|\r/g, ' ')}";

            export default css;
          `;
        }
      }
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};