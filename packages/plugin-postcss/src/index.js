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

  async shouldIntercept(url) {
    return Promise.resolve(path.extname(url) === '.css');
  }

  async intercept(url, body) {
    return new Promise(async(resolve, reject) => {
      try {
        const { projectDirectory } = this.compilation.context;
        const postcssConfigRoot = fs.existsSync(`${projectDirectory}`, 'postcss.config.js')
          ? projectDirectory
          : __dirname;
        const postcssConfigPath = `${postcssConfigRoot}/postcss.config`;
        const postcssConfig = require(postcssConfigPath);
        const postcssPlugins = postcssConfig.plugins || [];
        const css = postcssPlugins.length > 0
          ? (await postcss(postcssPlugins).process(body, { from: url })).css
          : body;

        resolve({
          body: css
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}

module.exports = (options = {}) => {
  return {
    type: 'resource',
    name: 'plugin-postcss',
    provider: (compilation) => new PostCssResource(compilation, options)
  };
};