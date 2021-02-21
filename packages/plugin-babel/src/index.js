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

function getConfig (compilation) {
  const { projectDirectory } = compilation.context;
  const configFile = 'babel.config';
  const configRoot = fs.existsSync(`${projectDirectory}/${configFile}.js`)
    ? projectDirectory
    : __dirname;
  
  return require(`${configRoot}/${configFile}`);
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
        const config = getConfig(this.compilation);
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