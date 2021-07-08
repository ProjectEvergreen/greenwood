/*
 *
 * Enables using JavaScript to import TypeScript files, using ESM syntax.
 *
 */
const rollupPluginTypescript = require('@rollup/plugin-typescript');
const fs = require('fs').promises;
const path = require('path');
const { ResourceInterface } = require('@greenwood/cli/src/lib/resource-interface');
const tsc = require('typescript');

class TypeScriptResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['.ts'];
    this.contentType = 'text/javascript';
    this.compilerOptions = {
      target: 'es2020',
      module: 'es2020',
      moduleResolution: 'node',
      sourcemaps: true
    };
  }

  async serve(url) {
    return new Promise(async (resolve, reject) => {
      try {
        const { projectDirectory } = this.compilation.context;
        const source = await fs.readFile(url, 'utf-8');
        const customOptions = this.options.extendConfig
          ? require(path.join(projectDirectory, 'tsconfig.json'))
          : { compilerOptions: {} };
        const compilerOptions = {
          ...this.compilerOptions,
          ...customOptions.compilerOptions
        };
        
        // https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API
        // https://www.typescriptlang.org/docs/handbook/tsconfig-json.html
        const result = tsc.transpileModule(source, { compilerOptions });

        resolve({
          body: result.outputText,
          contentType: this.contentType
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
    name: 'plugin-import-typescript:resource',
    provider: (compilation) => new TypeScriptResource(compilation, options)
  }, {
    type: 'rollup',
    name: 'plugin-import-typescript:rollup',
    provider: () => [
      rollupPluginTypescript()
    ]
  }];
};