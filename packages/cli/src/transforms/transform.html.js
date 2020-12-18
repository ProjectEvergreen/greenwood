const fs = require('fs');
const path = require('path');
const TransformInterface = require('./transform.interface');
const { getAppTemplate, getAppTemplateScripts, getUserScripts, getMetaContent } = require('./transform.tools');

class HTMLTransform extends TransformInterface {

  constructor(req) {
    super(req, ['.html'], 'text/html');
  }

  shouldTransform() {
    const { url } = this.request;
    const barePath = url.endsWith('/')
      ? `${this.workspace}/pages${url}index`
      : `${this.workspace}/pages${url.replace('.html', '')}`;
      
    return (this.extensions.indexOf(path.extname(url)) >= 0 || path.extname(url) === '') && 
      (fs.existsSync(`${barePath}.html`) || barePath.substring(barePath.length - 5, barePath.length) === 'index');
  }

  async applyTransform() {
    // do stuff with path
    let { url } = this.request;

    return new Promise(async (resolve, reject) => {
      try {
        // do something with markdown or html
        const barePath = url[url.length - 1] === '/'
          ? `${this.workspace}/pages${url}index`
          : `${this.workspace}/pages${url.replace('.html', '')}`;
        
        let body = await getAppTemplate(barePath, this.workspace);
        body = await getAppTemplateScripts(body, this.workspace);
        body = getUserScripts(body, this.workspace);
        body = getMetaContent(url.replace('index.html', ''), this.config, body);

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

module.exports = HTMLTransform;