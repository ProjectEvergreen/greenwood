/*
 * 
 * Enable using Babel process for JavaScript files.
 *
 */
const babel = require('@babel/core');
const fs = require('fs');
const path = require('path');
const { ResourceInterface } = require('@greenwood/cli/src/lib/resource-interface');
const rollupBabelPlugin = require('@rollup/plugin-babel').default;
const defaultConfig = require('./babel.config');

function getConfig (compilation, mergeConfigs) {
  const { projectDirectory } = compilation.context;
  const configFile = 'babel.config';
  const configRoot = fs.existsSync(`${projectDirectory}/${configFile}.js`) || merge
    ? projectDirectory
    : __dirname;
  const userConfig = require(`${configRoot}/${configFile}`);
  let finalConfig = Object.assign({}, userConfig);
  
  if (mergeConfigs) {
    const presets = userConfig.presets
      ? [...userConfig.presets, ...defaultConfig.presets]
      : [...defaultConfig.presets];
    const plugins = userConfig.plugins
      ? [...userConfig.plugins, ...defaultConfig.plugins]
      : [...defaultConfig.plugins];
    
    finalConfig.presets = [
      ...presets
    ];
    finalConfig.plugins = [
      ...plugins
    ];
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
        const config = getConfig(this.compilation, this.options.mergeConfigs);
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
        babelHelpers: 'bundled',
        ...getConfig(compilation)
      })
    ]
  }];
};