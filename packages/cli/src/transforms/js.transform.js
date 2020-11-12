const { promises: fsp } = require('fs');
const path = require('path');

module.exports = filterJavascript = async (ctx, userWorkspace) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (ctx.request.url.indexOf('/node_modules') < 0 && ctx.request.url.indexOf('.js') >= 0 && ctx.request.url.indexOf('.json') < 0) {
        const jsPath = path.join(userWorkspace, ctx.request.url);
        const contents = await fsp.readFile(jsPath, 'utf-8');

        ctx.set('Content-Type', 'text/javascript');
        ctx.body = contents;
      }
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};