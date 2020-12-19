const path = require('path');
const { promises: fsp } = require('fs');
const TransformInterface = require('./transform.interface');
const fs = require('fs');

class CSSTransform extends TransformInterface {

  constructor(req, compilation) {
    super(req, compilation, {
      extensions: ['.html'], 
      contentType: 'text/css'
    });
  }

  shouldTransform() {
    const { url } = this.request;
    const barePath = url.endsWith('/')
      ? `${this.workspace}/pages${url}index`
      : `${this.workspace}/pages${url.replace('.html', '')}`;
      
    return (this.extensions.indexOf(path.extname(url)) >= 0 || path.extname(url) === '') && 
      (fs.existsSync(`${barePath}.html`) || barePath.substring(barePath.length - 5, barePath.length) === 'index');
  }

  async applyTransform(response) {
    // do stuff with path
    return new Promise(async (resolve, reject) => {
      console.log('csstransform', response);
      resolve({
        body: 'test',
        contentType: 'test',
        extension:['test']
      })
      // try {
      //   const { url, header } = this.request;
      //   const destHeader = header['sec-fetch-dest'];
      //   const cssPath = url.indexOf('/node_modules') >= 0
      //     ? path.join(process.cwd(), url)
      //     : path.join(this.workspace, url);
        
      //   const css = await fsp.readFile(cssPath, 'utf-8');
      //   let body = '', contentType = '';

      //   // <style> tag used
      //   if (destHeader === 'style') {
      //     contentType = 'text/css';
      //     body = css;
      //   } else if (destHeader === 'empty') {
      //     // assume JS import being being used
      //     contentType = 'text/javascript';
      //     // TODO line breaks are bad for fetch, need to return CSS string all on one line
      //     body = `const css = "${css.replace(/\r?\n|\r/g, ' ')}";\nexport default css;`;
      //   }

      //   resolve({
      //     body,
      //     contentType,
      //     extension: this.extentsions
      //   });
      // } catch (e) {
      //   reject(e);
      // }
    });
  }
}

module.exports = CSSTransform;