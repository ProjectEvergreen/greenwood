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

  async intercept(url, body) {
    console.log('url', url);
    console.log('body???????', body);
    return new Promise(async (resolve, reject) => {
      try {
        const json = await fs.promises.readFile(url, 'utf-8');
        const jsonInJs = `const json = ${JSON.stringify(json).replace(/\r?\n|\r/g, ' ')};\nexport default json;`;
        // const jsonInJs = 'export default {};';
        
        console.debug('intercepted json-in-js', jsonInJs);

        resolve({
          body: jsonInJs,
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

// url /Users/owenbuckley/Workspace/project-evergreen/repos/greenwood/www/data.json
// headers {
//   request: {
//     host: 'localhost:1984',
//     connection: 'keep-alive',
//     pragma: 'no-cache',
//     'cache-control': 'no-cache',
//     'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="90", "Google Chrome";v="90"',
//     'sec-ch-ua-mobile': '?0',
//     'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.72 Safari/537.36',
//     accept: '*/*',
//     'sec-fetch-site': 'same-origin',
//     'sec-fetch-mode': 'cors',
//     'sec-fetch-dest': 'empty',
//     referer: 'http://localhost:1984/',
//     'accept-encoding': 'gzip, deflate, br',
//     'accept-language': 'en-US,en;q=0.9,es;q=0.8,it;q=0.7',
//     cookie: '_ga=GA1.1.2112235173.1566163902'
//   },
//   response: [Object: null prototype] {
//     'content-type': 'application/json; charset=utf-8'
//   }
// }
// shouldIntercept false

// url /Users/owenbuckley/Workspace/project-evergreen/repos/greenwood/www/graph.json
// headers {
//   request: {
//     host: 'localhost:1984',
//     connection: 'keep-alive',
//     pragma: 'no-cache',
//     'cache-control': 'no-cache',
//     'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="90", "Google Chrome";v="90"',
//     'sec-ch-ua-mobile': '?0',
//     'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.72 Safari/537.36',
//     accept: '*/*',
//     'sec-fetch-site': 'same-origin',
//     'sec-fetch-mode': 'cors',
//     'sec-fetch-dest': 'empty',
//     referer: 'http://localhost:1984/',
//     'accept-encoding': 'gzip, deflate, br',
//     'accept-language': 'en-US,en;q=0.9,es;q=0.8,it;q=0.7',
//     cookie: '_ga=GA1.1.2112235173.1566163902'
//   },
//   response: [Object: null prototype] {
//     'content-type': 'application/json; charset=utf-8'
//   }
// }
// shouldIntercept false

// url /Users/owenbuckley/Workspace/project-evergreen/repos/greenwood/www/package.json
// headers {
//   request: {
//     host: 'localhost:1984',
//     connection: 'keep-alive',
//     pragma: 'no-cache',
//     'cache-control': 'no-cache',
//     'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="90", "Google Chrome";v="90"',
//     'sec-ch-ua-mobile': '?0',
//     'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.72 Safari/537.36',
//     accept: '*/*',
//     'sec-fetch-site': 'same-origin',
//     'sec-fetch-mode': 'cors',
//     'sec-fetch-dest': 'empty',
//     referer: 'http://localhost:1984/',
//     'accept-encoding': 'gzip, deflate, br',
//     'accept-language': 'en-US,en;q=0.9,es;q=0.8,it;q=0.7',
//     cookie: '_ga=GA1.1.2112235173.1566163902'
//   },
//   response: [Object: null prototype] {
//     'content-type': 'application/json; charset=utf-8'
//   }
// }
// shouldIntercept false