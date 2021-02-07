/*
 * 
 * Manages web standard resource related operations for JavaScript.
 * This is a Greenwood default plugin.
 *
 */
const fs = require('fs');
// const path = require('path');
const { ResourceInterface } = require('../../lib/resource-interface');
// const { terser } = require('rollup-plugin-terser');
// const rollupStream = require('@rollup/stream');

class StandardJavaScriptResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['.js'];
    this.contentType = 'text/javascript';
  }

  async serve(url) {
    return new Promise(async(resolve, reject) => {
      try {
        const body = await fs.promises.readFile(url, 'utf-8');
    
        resolve({
          body,
          contentType: this.contentType
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  // async shouldOptimize(url) {
  //   return Promise.resolve(path.extname(url) === this.extensions[0]);
  // }

  // async optimize(url) {
  //   return new Promise(async(resolve, reject) => {
  //     try {
  //       const options = {
  //         input: url,
  //         output: { format: 'esm' },
  //         plugins: [
  //           terser()
  //         ]
  //       };
  //       const stream = rollupStream(options);
  //       let bundle = '';

  //       stream.on('data', (data) => (bundle += data));
  //       stream.on('end', () => {
  //         resolve(bundle);
  //       });
  //     } catch (e) {
  //       reject(e);
  //     }
  //   });
  // }
}

module.exports = {
  type: 'resource',
  name: 'plugin-standard-javascript',
  provider: (compilation, options) => new StandardJavaScriptResource(compilation, options)
};