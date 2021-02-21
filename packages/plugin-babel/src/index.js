/*
 * 
 * Enable using Babel process for JavaScript files.
 *
 */
const babel = require('@babel/core');
const fs = require('fs');
const path = require('path');
const { ResourceInterface } = require('@greenwood/cli/src/lib/resource-interface');

class BabelResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['.js'];
    this.contentType = ['text/javascript'];
  }

  isResolvableJavascriptFile(url) {
    return path.extname(url) === this.extensions[0] && url.indexOf('node_modules/') < 0;
  }

  getConfig() {
    const { projectDirectory } = this.compilation.context;
    const configFile = 'babel.config';
    const configRoot = fs.existsSync(`${projectDirectory}/${configFile}.js`)
      ? projectDirectory
      : __dirname;
    
    return require(`${configRoot}/${configFile}`);
  }

  async shouldIntercept(url) {
    return Promise.resolve(this.isResolvableJavascriptFile(url));
  }

  async intercept(url, body) {
    return new Promise(async(resolve, reject) => {
      try {
        const config = this.getConfig();
        const result = await babel.transform(body, config);
        
        resolve({
          body: result.code
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  async shouldOptimize(url) {
    return Promise.resolve(this.isResolvableJavascriptFile(url));
  }
  
  async optimize(url, body) {
    const config = this.getConfig();
    const result = await babel.transform(body, config);
    
    return Promise.resolve(result.code);
  }
}

module.exports = (options = {}) => {
  return {
    type: 'resource',
    name: 'plugin-babel',
    provider: (compilation) => new BabelResource(compilation, options)
  };
};