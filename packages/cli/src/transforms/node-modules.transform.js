const { promises: fsp } = require('fs');
const path = require('path');

module.exports = filterModule = async (ctx) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (ctx.url.indexOf('/node_modules') >= 0) {
        const modulePath = path.join(process.cwd(), ctx.url);
        const contents = await fsp.readFile(modulePath, 'utf-8'); // have to handle CJS vs ESM?
        const type = ctx.url.indexOf('.js') > 0
          ? 'text/javascript'
          : 'text/css'; // TODO eve components assume a bundler

        ctx.set('Content-Type', type);
        ctx.body(contents);
      }
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};