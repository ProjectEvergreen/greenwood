/*
 * 
 * Enable using PostCSS process for CSS files.
 *
 */
import fs from 'fs';
import path from 'path';
import postcss from 'postcss';
import { ResourceInterface } from '@greenwood/cli/src/lib/resource-interface.js';

async function getConfig (compilation, extendConfig = false) {
  const { projectDirectory } = compilation.context;
  const configFile = 'postcss.config.js';
  const defaultConfig = (await import(new URL(configFile, import.meta.url).pathname)).default;
  const userConfig = fs.existsSync(path.join(projectDirectory, `${configFile}`))
    ? (await import(path.join(projectDirectory, `${configFile}`))).default
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
        const config = await getConfig(this.compilation, this.options.extendConfig);
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
    const config = await getConfig(this.compilation, this.options.extendConfig);
    const plugins = config.plugins || [];
    
    plugins.push(
      (await import('cssnano')).default
    );
    
    const css = plugins.length > 0
      ? (await postcss(plugins).process(body, { from: workspaceUrl })).css
      : body;
    
    return Promise.resolve(css);
  }
}

const greenwoodPluginPostCss = (options = {}) => {
  return {
    type: 'resource',
    name: 'plugin-postcss',
    provider: (compilation) => new PostCssResource(compilation, options)
  };
};

export { greenwoodPluginPostCss };