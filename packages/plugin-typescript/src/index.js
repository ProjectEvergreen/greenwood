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

const defaultcompilerOptions = {
  target: 'es2020',
  module: 'es2020',
  moduleResolution: 'node',
  sourceMap: true
};

function getCompilerOptions (projectDirectory, extendConfig) {
  const customOptions = extendConfig
    ? require(path.join(projectDirectory, 'tsconfig.json'))
    : { compilerOptions: {} };

  return compilerOptions = {
    ...defaultcompilerOptions,
    ...customOptions.compilerOptions
  };
}

class TypeScriptResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['.ts'];
    this.contentType = 'text/javascript';
  }

  async serve(url) {
    return new Promise(async (resolve, reject) => {
      try {
        const { projectDirectory } = this.compilation.context;
        const source = await fs.readFile(url, 'utf-8');
        const compilerOptions = getCompilerOptions(projectDirectory, this.options.extendConfig);

        // https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API
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
    provider: (compilation) => {
      const compilerOptions = getCompilerOptions(compilation.context.projectDirectory, options.extendConfig);

      return [
        rollupPluginTypescript(compilerOptions)
      ];
    }
  }];
};