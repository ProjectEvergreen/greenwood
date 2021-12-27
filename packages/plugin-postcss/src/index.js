/*
 * 
 * Enable using PostCSS process for CSS files.
 *
 */
import fs from 'fs';
import path from 'path';
import postcss from 'postcss';
import { ResourceInterface } from '@greenwood/cli/src/lib/resource-interface.js';
import { pathToFileURL } from 'url';

async function getConfig (compilation, extendConfig = false) {
  const { projectDirectory } = compilation.context;
  const configFile = 'postcss.config';
  const defaultConfig = (await import(new URL(`${configFile}.js`, import.meta.url).pathname)).default;
  const userConfig = fs.existsSync(path.join(projectDirectory, `${configFile}.mjs`))
    ? (await import(pathToFileURL(path.join(projectDirectory, `${configFile}.mjs`)))).default
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
    const config = await getConfig(this.compilation, this.options.extendConfig);
    const plugins = config.plugins && config.plugins.length ? [...config.plugins] : [];
    
    plugins.push(
      (await import('cssnano')).default
    );

    const css = plugins.length > 0
      ? (await postcss(plugins).process(body, { from: url })).css
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