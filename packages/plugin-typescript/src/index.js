/*
 *
 * Enables using JavaScript to import TypeScript files, using ESM syntax.
 *
 */
import fs from 'fs/promises';
import { ResourceInterface } from '@greenwood/cli/src/lib/resource-interface.js';
import tsc from 'typescript';

const defaultCompilerOptions = {
  target: 'es2020',
  module: 'es2020',
  moduleResolution: 'node',
  sourceMap: true
};

async function getCompilerOptions (projectDirectory, extendConfig) {
  const customOptions = extendConfig
    ? JSON.parse(await fs.readFile(new URL('./tsconfig.json', projectDirectory), 'utf-8'))
    : { compilerOptions: {} };

  return {
    ...defaultCompilerOptions,
    ...customOptions.compilerOptions
  };
}

class TypeScriptResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['ts'];
    this.contentType = 'text/javascript';
  }

  async shouldServe(url) {
    const { pathname, protocol } = url;
    const isTsFile = protocol === 'file:' && pathname.split('.').pop() === this.extensions[0];

    return isTsFile || isTsFile && url.searchParams.has('type') && url.searchParams.get('type') === this.extensions[0];
  }

  async serve(url) {
    const { projectDirectory } = this.compilation.context;
    const source = await fs.readFile(url, 'utf-8');
    const compilerOptions = await getCompilerOptions(projectDirectory, this.options.extendConfig);
    // https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API
    const body = tsc.transpileModule(source, { compilerOptions }).outputText;

    return new Response(body, {
      headers: new Headers({
        'Content-Type': this.contentType
      })
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