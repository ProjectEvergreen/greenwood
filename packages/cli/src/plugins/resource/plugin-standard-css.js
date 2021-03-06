/*
 * 
 * Manages web standard resource related operations for CSS.
 * This is a Greenwood default plugin.
 *
 */
const fs = require('fs');
const cssnano = require('cssnano');
const path = require('path');
const postcss = require('postcss');
const { ResourceInterface } = require('../../lib/resource-interface');

class StandardCssResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['.css'];
    this.contentType = 'text/css';
  }

  async shouldServe(url) {
    const isCssFile = path.extname(url) === this.extensions[0];
    
    return Promise.resolve(isCssFile);
  }

  async serve(url) {
    return new Promise(async (resolve, reject) => {
      try {  
        const css = await fs.promises.readFile(url, 'utf-8');

        resolve({
          body: css,
          contentType: this.contentType
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  async shouldOptimize(url) {
    const isValidCss = path.extname(url) === this.extensions[0] && this.compilation.config.optimization !== 'none';
    
    return Promise.resolve(isValidCss);
  }

  async optimize(url, body) {
    return new Promise(async (resolve, reject) => {
      try {  
        const { outputDir, userWorkspace } = this.compilation.context;
        const workspaceUrl = url.replace(outputDir, userWorkspace);
        const css = (await postcss([cssnano]).process(body, { from: workspaceUrl })).css;

        resolve(css);
      } catch (e) {
        reject(e);
      }
    });
  }
}

module.exports = {
  type: 'resource',
  name: 'plugin-standard-css',
  provider: (compilation, options) => new StandardCssResource(compilation, options)
};