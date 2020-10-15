const { promises: fsp } = require('fs');
const path = require('path');

module.exports = filterJSON = async (ctx, { userWorkspace, scratchDir }) => {
  return new Promise(async (resolve, reject) => {
    try {
      // TODO This is here because of ordering, should make JS / JSON matching less greedy
      // handle things outside if workspace, like a root directory resolver plugin?
      if (ctx.request.url.indexOf('.json') >= 0) {
        // console.debug('JSON file request!', ctx.request.url);'

        if (ctx.request.url.indexOf('graph.json') >= 0) {
          const json = await fsp.readFile(path.join(scratchDir, 'graph.json'), 'utf-8');

          ctx.set('Content-Type', 'application/json');
          ctx.body = JSON.parse(json);
        } else {
          const json = await fsp.readFile(path.join(userWorkspace, ctx.request.url), 'utf-8');

          ctx.set('Content-Type', 'text/javascript');
          ctx.body = `
            export default ${json}
          `;
        }
      }
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};