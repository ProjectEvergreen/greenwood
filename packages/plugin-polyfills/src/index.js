const fs = require('fs');
const path = require('path');
const TransformInterface = require('@greenwood/cli/src/plugins/transforms/transform.interface');
const filename = 'webcomponents-loader.js';
const nodeModuleRoot = 'node_modules/@webcomponents/webcomponentsjs';
  
class PolyFillsPlugin extends TransformInterface {

  constructor(req, compilation) {
    super(req, compilation, {
      extensions: ['.html', '.md'], 
      contentType: 'text/html'
    });
  }

  shouldTransform() {
    const { request, workspace } = this;
    const { url } = request;

    const barePath = url.endsWith('/')
      ? `${workspace}/pages${url}index`
      : `${workspace}/pages${url.replace('.html', '')}`;

    return fs.existsSync(`${barePath}.md`) || fs.existsSync(`${barePath.replace('/index', '.md')}`);
  }

  async applyTransform(response) {
    
    return new Promise(async (resolve, reject) => {
      try {
        let body = response.body.replace(/<head>/, `<head>
        <!-- Web Components poyfill -->
        <script src="/${nodeModuleRoot}/${filename}"></script>`);

        // const webcomponentLoaderPath = path.join(__dirname, '../../..', nodeModuleRoot, filename);
        // const destinationPath = path.join(this.workspace, filename);

        // fs.copyFileSync(webcomponentLoaderPath, destinationPath);

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
      provider: (req, compilation) => new PolyFillsPlugin(req, compilation)
    }
  ];
};