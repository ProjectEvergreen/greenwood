/*
 *
 * Enables using JavaScript to import TypeScript files, using ESM syntax.
 *
 */
import fs from "node:fs/promises";
import tsc from "typescript";

const defaultCompilerOptions = {
  target: "es2020",
  module: "es2020",
  moduleResolution: "node",
  sourceMap: true,
};

async function getCompilerOptions(projectDirectory, extendConfig) {
  const customOptions = extendConfig
    ? JSON.parse(await fs.readFile(new URL("./tsconfig.json", projectDirectory), "utf-8"))
    : { compilerOptions: {} };

  return {
    ...defaultCompilerOptions,
    ...customOptions.compilerOptions,
  };
}

class TypeScriptResource {
  constructor(compilation, options) {
    this.compilation = compilation;
    this.options = options;
    this.extensions = ["ts"];
    this.servePage = options.servePage;
    this.contentType = "text/javascript";
  }

  async shouldServe(url, request) {
    const { pathname, protocol } = url;
    const hasJsHeaders =
      (request?.headers.get("Accept") ?? "").indexOf(this.contentType) >= 0 ||
      request.headers.get("Sec-Fetch-Dest") === "script";
    const serveAsPage =
      (request?.headers.get("Accept") ?? "").indexOf("text/html") >= 0 && this.options.servePage;
    const isTsFile = protocol === "file:" && pathname.split(".").pop() === this.extensions[0];

    return (
      (serveAsPage && isTsFile) ||
      (isTsFile && hasJsHeaders) ||
      (isTsFile &&
        url.searchParams.has("type") &&
        url.searchParams.get("type") === this.extensions[0])
    );
  }

  async serve(url) {
    const { projectDirectory } = this.compilation.context;
    const source = await fs.readFile(url, "utf-8");
    const compilerOptions = await getCompilerOptions(projectDirectory, this.options.extendConfig);
    // https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API
    const body = tsc.transpileModule(source, { compilerOptions }).outputText;

    return new Response(body, {
      headers: new Headers({
        "Content-Type": this.contentType,
      }),
    });
  }
}

/** @type {import('./types/index.d.ts').TypeScriptPlugin} */
const greenwoodPluginTypeScript = (options = {}) => {
  return [
    {
      type: "resource",
      name: "plugin-import-typescript:resource",
      provider: (compilation) =>
        new TypeScriptResource(compilation, {
          servePage: "dynamic",
          ...options,
        }),
    },
  ];
};

export { greenwoodPluginTypeScript };
