/*
 *
 * Enables using JavaScript to import TypeScript files, using ESM syntax.
 *
 */
const rollupPluginTypescript = require('@rollup/plugin-typescript');
const fs = require('fs').promises;
const { ResourceInterface } = require('@greenwood/cli/src/lib/resource-interface');
const tsc = require('typescript');

class ImportTypeScriptResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['.ts'];
    this.contentType = 'text/javascript';
    this.compilerOptions = {
      target: 'es2020',
      module: 'es2020',
      experimentalDecorators: true, // TODO
      moduleResolution: 'node'
    };
  }

  async serve(url) {
    return new Promise(async (resolve, reject) => {
      try {
        const source = await fs.readFile(url, 'utf-8');
        // TODO const tsConfig = await fs.readFile(path.join(__dirname, 'tsconfig.json'), 'utf-8');
        
        // https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API
        const result = tsc.transpileModule(source, {
          compilerOptions: this.compilerOptions
        });

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
    provider: (compilation) => new ImportTypeScriptResource(compilation, options)
  }, {
    type: 'rollup',
    name: 'plugin-import-typescript:rollup',
    provider: () => [
      rollupPluginTypescript()
    ]
  }];
};