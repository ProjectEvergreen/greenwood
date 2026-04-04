/*
 *
 * Compile Web Components rendering with JSX using wc-compiler.
 *
 */
import { generate } from "astring";
import { parseJsx } from "wc-compiler/jsx-loader";
import { mergeImportMap } from "@greenwood/cli/src/lib/node-modules-utils.js";
import { parse } from "node-html-parser";

const importMap = {
  "signal-polyfill": "/node_modules/signal-polyfill/dist/index.js",
  "wc-compiler/effect": "/node_modules/wc-compiler/src/effect.js",
};

class ImportJsxResource {
  constructor(compilation, options) {
    this.compilation = compilation;
    this.extensions = ["jsx", "tsx"];
    this.contentType = "text/javascript";
    this.servePage = options.servePages ? "dynamic" : null;
    this.signals = options.signals;
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

  async shouldIntercept(url, request, response) {
    return this.signals && response.headers.get("Content-Type")?.indexOf("text/html") >= 0;
  }

  async intercept(url, request, response) {
    const { polyfills } = this.compilation.config;
    const body = await response.text();
    let newBody = body;

    if (process.env.__GWD_COMMAND__ === "develop") {
      newBody = mergeImportMap(newBody, importMap, polyfills.importMaps);
    }

    const root = parse(newBody);
    const signalScript = parse(`
      <script type="module">
        import { Signal } from 'signal-polyfill';
        globalThis.Signal = Signal;
        </script>
      `);

    // find the import map script in root and insert the signal polyfill script after it
    const importMapScript = root.querySelector(
      'script[type="importmap"], script[type="importmap-shim"]',
    );

    if (importMapScript) {
      importMapScript.after(signalScript);
    } else {
      root.querySelector("head").prepend(signalScript);
    }

    newBody = root.toString();

    return new Response(newBody);
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
