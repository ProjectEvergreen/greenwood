/*
 * 
 * Enable using Babel for processing JavaScript files.
 *
 */
const babel = require('@babel/core');
const path = require('path');
const { ResourceInterface } = require('@greenwood/cli/src/lib/resource-interface');
const rollupBabelPlugin = require('@rollup/plugin-babel').default;

function getConfig (compilation, extendConfig = false) {
  const { projectDirectory } = compilation.context;
  const configFile = 'babel.config';
  const defaultConfig = require('./babel.config');
  const userConfig = require(`${projectDirectory}/${configFile}`);
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
        const config = getConfig(this.compilation, this.options.extendConfig);
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

module.exports = (options = {}) => {
  return [{
    type: 'resource',
    name: 'plugin-babel:resource',
    provider: (compilation) => new BabelResource(compilation, options)
  }, {
    type: 'rollup',
    name: 'plugin-babel:rollup',
    provider: (compilation) => [
      rollupBabelPlugin({
        // https://github.com/rollup/plugins/tree/master/packages/babel#babelhelpers
        babelHelpers: options.extendConfig ? 'runtime' : 'bundled',
        ...getConfig(compilation, options.extendConfig)
      })
    ]
  }];
};