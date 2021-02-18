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
    this.contentType = ['text/css'];
  }

  isCssFile(url) {
    return path.extname(url) === '.css';
  }

  getConfig() {
    const { projectDirectory } = this.compilation.context;
    const configFile = 'postcss.config';
    const configRoot = fs.existsSync(`${projectDirectory}/${configFile}.js`)
      ? projectDirectory
      : __dirname;
    
    return require(`${configRoot}/${configFile}`);
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
    const { outputDir, userWorkspace } = this.compilation.context;
    const workspaceUrl = url.replace(outputDir, userWorkspace);
    const config = this.getConfig();
    const plugins = (config.plugins || []).concat(
      require('cssnano') // TODO make configurable
    );
    const css = plugins.length > 0
      ? (await postcss(plugins).process(body, { from: workspaceUrl })).css
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