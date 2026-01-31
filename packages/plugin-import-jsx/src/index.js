/*
 *
 * Compile Web Components rendering with JSX using wc-compiler.
 *
 */
import { generate } from "astring";
import { parseJsx } from "wc-compiler/src/jsx-loader.js";

class ImportJsxResource {
  constructor(compilation, options) {
    this.compilation = compilation;
    this.extensions = ["jsx", "tsx"];
    this.contentType = "text/javascript";
    this.servePage = options.servePages ? "dynamic" : null;
  }

  async shouldServe(url) {
    const { pathname, protocol } = url;
    const ext = pathname.split(".").pop();

    return protocol === "file:" && this.extensions.includes(ext);
  }

  async serve(url) {
    // refactor when WCC refactors
    // https://github.com/ProjectEvergreen/wcc/issues/116
    const tree = parseJsx(url);
    const result = generate(tree);

    return new Response(result, {
      headers: new Headers({
        "Content-Type": this.contentType,
      }),
    });
  }
}

/** @type {import('./types/index.d.ts').ImportJsxPlugin} */
const greenwoodPluginImportJsx = (options = { servePages: true }) => [
  {
    type: "resource",
    name: "plugin-import-jsx:resource",
    provider: (compilation) => new ImportJsxResource(compilation, options),
  },
];

export { greenwoodPluginImportJsx };
