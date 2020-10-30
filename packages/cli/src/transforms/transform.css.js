const path = require('path');
const { promises: fsp } = require('fs');
const TransformInterface = require('./transform.interface');

module.exports = class cssTransform extends TransformInterface {

  constructor(req, compilation) {
    super(req, compilation, ['.css']);
  }

  async applyTransform() {
    // do stuff with path
    return new Promise(async (resolve, reject) => {
      try {
        const { url, header } = this.request;
        const destHeader = header['sec-fetch-dest'];
        const cssPath = url.indexOf('/node_modules') >= 0
          ? path.join(process.cwd(), url)
          : path.join(this.workspace, url);
        const css = await fsp.readFile(cssPath, 'utf-8');
        let body = '', contentType = '';

        // <style> tag used
        if (destHeader === 'style') {
          contentType = 'text/css';
          body = css;
        } else if (destHeader === 'empty') {
          // assume JS import being being used
          contentType = 'text/javascript';
          body = `const css = "${css.replace(/\r?\n|\r/g, ' ')}";
export default css;
          `;
        }

        resolve({
          body,
          contentType,
          extension: '.css'
        });
      } catch (e) {
        reject(e);
      }
    });
  }
};