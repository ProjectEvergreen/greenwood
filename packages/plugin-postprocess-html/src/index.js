const fs = require('fs');
const path = require('path');
const TransformInterface = require('@greenwood/cli/src/transforms/transform.interface');

class TestPostTransform extends TransformInterface {

  constructor(req, compilation) {
    super(req, compilation, {
      extensions: ['.html'], 
      constentType: 'text/html'
    });
  }

  shouldTransform() {
    const { url } = this.request;
    const barePath = url.endsWith('/')
      ? `${this.workspace}/pages${url}index`
      : `${this.workspace}/pages${url.replace('.html', '')}`;
      
    return (this.extensions.indexOf(path.extname(url)) >= 0 || path.extname(url) === '') && 
      fs.existsSync(`${barePath}.html`);
  }

  async applyTransform(response) {
    
    return new Promise(async (resolve, reject) => {
      try {
        let body = response.body.replace(/<\/h1>/, ' post process plugin </h1>\n');

        resolve({
          body,
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
      type: 'transform-post',
      provider: (req, compilation) => new TestPostTransform(req, compilation)
    }
  ];
};