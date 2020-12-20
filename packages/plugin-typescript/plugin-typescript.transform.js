const path = require('path');
const { promises: fsp } = require('fs');
const TransformInterface = require('../cli/src/transforms/transform.interface');
const ts = require('typescript');

class TSTransform extends TransformInterface {

  constructor(req, compilation) {
    super(req, compilation, { 
      extensions: ['.ts'], 
      contentType: ['text/javascript']
    });
  }

  async applyTransform(response) {
    console.log('TS FOUND');
    return new Promise(async (resolve, reject) => {
      try {
        const { url } = this.request;
        const jsPath = url.indexOf('/node_modules') >= 0
          ? path.join(process.cwd(), url)
          : path.join(this.workspace, this.request.url);

        const result = response && response.body || await fsp.readFile(jsPath, 'utf-8');
        
        const body = ts.transpileModule(result, { compilerOptions: { module: ts.ModuleKind.AMD } }).outputText;

        console.log(body);
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
      type: 'transform-pre',
      provider: (req, compilation) => new TSTransform(req, compilation)
    }
  ];
};