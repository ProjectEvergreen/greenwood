const path = require('path');
const { promises: fsp } = require('fs');
const TransformInterface = require('../cli/src/transforms/transform.interface');
const sass = require('node-sass');

class SassTransform extends TransformInterface {

  constructor(req, compilation) {
    super(req, compilation, {
      extensions: ['.scss'], 
      constentType: 'text/css'
    });
  }

  async applyTransform() {
    
    return new Promise(async (resolve, reject) => {
      try {
        const { url, header } = this.request;
        const destHeader = header['sec-fetch-dest'];
        const cssPath = url.indexOf('/node_modules') >= 0
          ? path.join(process.cwd(), url)
          : path.join(this.workspace, url);
        
        let css = await fsp.readFile(cssPath, 'utf-8');
        const result = sass.renderSync({
          data: css,
          includePaths: [this.workspace]
        });
        let body = '', contentType = '';
        css = result.css.toString();

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

module.exports = () => {
  return [
    {
      type: 'transform-pre',
      provider: (req, compilation) => new SassTransform(req, compilation)
    }
  ];
};