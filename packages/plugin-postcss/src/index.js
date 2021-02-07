/*
 * 
 * Enable using PostCSS process for CSS files.
 *
 */
const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const { ResourceInterface } = require('@greenwood/cli/src/lib/resource-interface');

class PostCssResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['.css'];
  }

  isCssFile(url) {
    return path.extname(url) === '.css';
  }

  getConfig() {
    const { projectDirectory } = this.compilation.context;
    const configRoot = fs.existsSync(`${projectDirectory}`, 'postcss.config.js')
      ? projectDirectory
      : __dirname;
    
    return require(`${configRoot}/postcss.config`);
  }

  async shouldIntercept(url) {
    return Promise.resolve(this.isCssFile(url));
  }

  async intercept(url, body) {
    return new Promise(async(resolve, reject) => {
      try {
        const config = this.getConfig();
        const plugins = config.plugins || [];
        const css = plugins.length > 0
          ? (await postcss(plugins).process(body, { from: url })).css
          : body;
        
        resolve({
          body: css
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  async shouldOptimize(url) {
    return Promise.resolve(this.isCssFile(url));
  }

  async optimize(url, body) {
    const config = this.getConfig();
    const plugins = config.plugins || [];
    const css = plugins.length > 0
      ? (await postcss(plugins).process(body, { from: url })).css
      : body;

    return Promise.resolve(css);
  }
}

module.exports = (options = {}) => {
  return {
    type: 'resource',
    name: 'plugin-postcss',
    provider: (compilation) => new PostCssResource(compilation, options)
  };
};