/*
 * 
 * Enable using PostCSS process for CSS files.
 *
 */
const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const { ResourceInterface } = require('@greenwood/cli/src/lib/resource-interface');

function getConfig (compilation, extendConfig = false) {
  const { projectDirectory } = compilation.context;
  const configFile = 'postcss.config';
  const defaultConfig = require(path.join(__dirname, configFile));
  const userConfig = fs.existsSync(path.join(projectDirectory, `${configFile}.js`))
    ? require(`${projectDirectory}/${configFile}`)
    : {};
  let finalConfig = Object.assign({}, userConfig);
  
  if (userConfig && extendConfig) {    
    finalConfig.plugins = Array.isArray(userConfig.plugins)
      ? [...defaultConfig.plugins, ...userConfig.plugins]
      : [...defaultConfig.plugins];
  }

  return finalConfig;
}

class PostCssResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['.css'];
    this.contentType = ['text/css'];
  }

  isCssFile(url) {
    return path.extname(url) === '.css';
  }

  async shouldIntercept(url) {
    return Promise.resolve(this.isCssFile(url));
  }

  async intercept(url, body) {
    return new Promise(async(resolve, reject) => {
      try {
        const config = getConfig(this.compilation, this.options.extendConfig);
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
    const config = getConfig(this.compilation, this.options.extendConfig);
    const plugins = config.plugins || [];
    
    plugins.push(
      require('cssnano')
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