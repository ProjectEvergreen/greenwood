/*
 * 
 * Manages web standard resource related operations for JavaScript.
 * This is a Greenwood default plugin.
 *
 */
const fs = require('fs');
// const json = require('@rollup/plugin-json');
const { ResourceInterface } = require('@greenwood/cli/src/lib/resource-interface');

class ImportJsonResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['.json'];
    this.contentType = 'text/javascript';
  }

  async shouldIntercept(url, body, headers) {
    const { originalUrl } = headers.request;
    const isJsonInJs = originalUrl && originalUrl.indexOf('?type=json') >= 0;
    
    return Promise.resolve(isJsonInJs);
  }

  async intercept(url) {
    console.log('url', url);
    return new Promise(async (resolve, reject) => {
      try {
        const json = await fs.promises.readFile(url, 'utf-8');
        const body = `export default ${json}`;

        console.debug('intercepted json-in-js', body);

        resolve({
          body,
          contentType: this.contentType
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}

// serve(url, headers) {
//   return new Promise(async (resolve, reject) => {
//     try {
//       const filePath = url.indexOf('graph.json') >= 0
//         ? url.replace(userWorkspace, scratchDir)
//         : url;
//       const { scratchDir, userWorkspace } = this.compilation.context;
//       const { originalUrl } = headers.request;
//       const contents = await fs.promises.readFile(filePath, 'utf-8');
//       const isJsonInJs = originalUrl && originalUrl.indexOf('?type=json') >= 0;
//       let body;
//       let contentType;

//       if (isJsonInJs) {
//         contentType = 'text/javascript';
//         body = `export default ${contents}`;
//       } else {
//         body = JSON.parse(contents);
//         contentType = this.contentType;
//       }


module.exports = (options = {}) => {
  return [{
    type: 'resource',
    name: 'plugin-import-json:resource',
    provider: (compilation) => new ImportJsonResource(compilation, options)
  // }, {
  //   type: 'rollup',
  //   name: 'plugin-import-json:rollup',
  //   provider: () => {
  //     return [
  //       json()
  //     ];
  //   }
  }];
};