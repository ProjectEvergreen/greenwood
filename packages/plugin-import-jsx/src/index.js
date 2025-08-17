/*
 *
 * Compile Web Components rendering with JSX using wc-compiler.
 *
 */
import escodegen from "escodegen";
import { parseJsx } from "wc-compiler/src/jsx-loader.js";

class ImportJsxResource {
  constructor(compilation) {
    this.compilation = compilation;
    this.extensions = ["jsx"];
    this.contentType = "text/javascript";
  }

  async shouldServe(url) {
    const { pathname, protocol } = url;
    const ext = pathname.split(".").pop();

    return protocol === "file:" && ext === this.extensions[0];
  }

  async serve(url) {
    // refactor when WCC refactors
    // https://github.com/ProjectEvergreen/wcc/issues/116
    const tree = parseJsx(url);
    const result = escodegen.generate(tree);

    return new Response(result, {
      statusText: "OK",
      headers: new Headers({
        "Content-Type": this.contentType,
      }),
    });
  }
}

/** @type {import('./types/index.d.ts').ImportJsxPlugin} */
const greenwoodPluginImportJsx = () => [
  {
    type: "resource",
    name: "plugin-import-jsx:resource",
    provider: (compilation) => new ImportJsxResource(compilation),
  },
];

export { greenwoodPluginImportJsx };
