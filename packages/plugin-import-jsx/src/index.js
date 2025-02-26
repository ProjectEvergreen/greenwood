/*
 *
 * Compile Web Components rendering with JSX using wc-compiler.
 *
 */
import escodegen from "escodegen";
import { parseJsx } from "wc-compiler/src/jsx-loader.js";
import { ResourceInterface } from "@greenwood/cli/src/lib/resource-interface.js";

class ImportJsxResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
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
      headers: new Headers({
        "Content-Type": this.contentType,
      }),
    });
  }
}

const greenwoodPluginImportJsx = (options = {}) => [
  {
    type: "resource",
    name: "plugin-import-jsx:resource",
    provider: (compilation) => new ImportJsxResource(compilation, options),
  },
];

export { greenwoodPluginImportJsx };
