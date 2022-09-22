/*
 *
 * Enables using JavaScript to import TypeScript files, using ESM syntax.
 *
 */
import fs from 'fs';
import path from 'path';
import { ResourceInterface } from '@greenwood/cli/src/lib/resource-interface.js';
import tsc from 'typescript';

const defaultCompilerOptions = {
  target: 'es2020',
  module: 'es2020',
  moduleResolution: 'node',
  sourceMap: true
};

function getCompilerOptions (projectDirectory, extendConfig) {
  const customOptions = extendConfig
    ? JSON.parse(fs.readFileSync(path.join(projectDirectory, 'tsconfig.json'), 'utf-8'))
    : { compilerOptions: {} };

  return {
    ...defaultCompilerOptions,
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
        const source = await fs.promises.readFile(url, 'utf-8');
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

const greenwoodPluginTypeScript = (options = {}) => {
  return [{
    type: 'resource',
    name: 'plugin-import-typescript:resource',
    provider: (compilation) => new TypeScriptResource(compilation, options)
  }];
};

export {
  greenwoodPluginTypeScript
};