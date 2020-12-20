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
        console.log('SASS FOUND!');
        const { url } = this.request;
        const cssPath = url.indexOf('/node_modules') >= 0
          ? path.join(process.cwd(), url)
          : path.join(this.workspace, url);
        
        let css = await fsp.readFile(cssPath, 'utf-8');
        const result = sass.renderSync({
          data: css
        });

        css = result.css.toString();
        resolve({
          body: css,
          contentType: this.contentType,
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