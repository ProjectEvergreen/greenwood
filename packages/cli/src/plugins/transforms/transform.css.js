const path = require('path');
const { promises: fsp } = require('fs');
const TransformInterface = require('./transform.interface');

class CSSTransform extends TransformInterface {

  constructor(req, compilation) {
    super(req, compilation, {
      extensions: ['.css'], 
      contentType: 'text/css'
    });
  }

  shouldTransform(response) {
    return this.extensions.indexOf(path.extname(this.request.url)) >= 0 || response.contentType === this.contentType;
  }

  async applyTransform(response) {
    // do stuff with path
    return new Promise(async (resolve, reject) => {
      try {
        const { url, header } = this.request;
        const destHeader = header['sec-fetch-dest'];
        const cssPath = url.indexOf('/node_modules') >= 0
          ? path.join(process.cwd(), url)
          : path.join(this.workspace, url);
        
        let css = response.body || await fsp.readFile(cssPath, 'utf-8');
        let body = '', contentType = '';

        // <style> tag used
        if (destHeader === 'style') {
          contentType = 'text/css';
          body = css;
        } else if (destHeader === 'empty') {
          // assume JS import being being used
          contentType = 'text/javascript';
          // TODO line breaks are bad for fetch, need to return CSS string all on one line
          body = `const css = "${css.replace(/\r?\n|\r/g, ' ')}";\nexport default css;`;
        }

        resolve({
          body,
          contentType,
          extension: this.extensions
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}

module.exports = CSSTransform;