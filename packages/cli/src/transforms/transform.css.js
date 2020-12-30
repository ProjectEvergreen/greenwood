const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const TransformInterface = require('./transform.interface');

class CSSTransform extends TransformInterface {

  constructor(req) {
    super(req, ['.css'], 'text/css');
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
        
        let css = await fs.promises.readFile(cssPath, 'utf-8');
        let body = '', contentType = '';

        // TODO try and use context.projectDirectory
        if (fs.existsSync(path.join(process.cwd(), 'postcss.config.js'))) {
          const userPostcssConfig = require(`${process.cwd()}/postcss.config`);
          const userPostcssPlugins = userPostcssConfig.plugins || [];
          
          if (userPostcssPlugins.length > 0) {
            const result = await postcss(userPostcssPlugins)
              .process(css, { from: cssPath });

            css = result.css;
          }
        }

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
          extension: this.extentsions
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}

module.exports = CSSTransform;