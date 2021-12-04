/*
 * 
 * Enable using Babel for processing JavaScript files.
 *
 */
import babel from '@babel/core';
import fs from 'fs';
import path from 'path';
import { ResourceInterface } from '@greenwood/cli/src/lib/resource-interface.js';
import rollupBabelPlugin from '@rollup/plugin-babel';

async function getConfig (compilation, extendConfig = false) {
  const { projectDirectory } = compilation.context;
  const configFile = 'babel.config.mjs';
  const defaultConfig = (await import(new URL(configFile, import.meta.url).pathname)).default;
  const userConfig = fs.existsSync(path.join(projectDirectory, configFile))
    ? (await import(`${projectDirectory}/${configFile}`)).default
    : {};
  let finalConfig = Object.assign({}, userConfig);
  
  if (extendConfig) {    
    finalConfig.presets = Array.isArray(userConfig.presets)
      ? [...defaultConfig.presets, ...userConfig.presets]
      : [...defaultConfig.presets];
    
    finalConfig.plugins = Array.isArray(userConfig.plugins)
      ? [...defaultConfig.plugins, ...userConfig.plugins]
      : [...defaultConfig.plugins];
  }

  return finalConfig;
}

class BabelResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['.js'];
    this.contentType = ['text/javascript'];
  }

  async shouldIntercept(url) {
    return Promise.resolve(path.extname(url) === this.extensions[0] && url.indexOf('node_modules/') < 0);
  }

  async intercept(url, body) {
    return new Promise(async(resolve, reject) => {
      try {
        const config = await getConfig(this.compilation, this.options.extendConfig);
        const result = await babel.transform(body, config);
        
        resolve({
          body: result.code
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}
 
const greenwoodPluginBabel = (options = {}) => {
  return [{
    type: 'resource',
    name: 'plugin-babel:resource',
    provider: (compilation) => new BabelResource(compilation, options)
  }, {
    type: 'rollup',
    name: 'plugin-babel:rollup',
    provider: (compilation) => [
      rollupBabelPlugin.default({
        // https://github.com/rollup/plugins/tree/master/packages/babel#babelhelpers
        babelHelpers: options.extendConfig ? 'runtime' : 'bundled',
        
        ...getConfig(compilation, options.extendConfig)
      })
    ]
  }];
};

export { greenwoodPluginBabel };