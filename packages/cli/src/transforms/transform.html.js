const path = require('path');
const TransformInterface = require('./transform.interface');
const { getAppTemplate, getAppTemplateScripts, getUserScripts, getMetaContent } = require('./transform.tools');

module.exports = class TransformHtml extends TransformInterface {

  constructor(req, compilation) {
    super(req, compilation, ['.html']);
  }

  shouldTransform() {
    const { url } = this.request;
    return this.extensions.indexOf(path.extname(url)) >= 0 || path.extname(url) === '';
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

        let body = await getAppTemplate(barePath);
        body = await getAppTemplateScripts(body, this.workspace);
        body = getUserScripts(body, this.workspace);
        body = getMetaContent(url, this.config, body);

        resolve({
          body,
          contentType: 'text/html',
          extension: '.html'
        });
      } catch (e) {
        reject(e);
      }
    });
  }
};