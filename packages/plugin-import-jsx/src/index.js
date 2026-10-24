/*
 *
 * Compile Web Components rendering with JSX using wc-compiler.
 *
 */
import { generate } from "astring";
import { parseJsx } from "wc-compiler/jsx-loader";
import {
  mergeImportMap,
  insertAfterImportMap,
  getPackageRoot,
} from "@greenwood/cli/src/lib/node-modules-utils.js";
import { getMatchingPageByRoute } from "@greenwood/cli/src/lib/graph-utils.js";
import {
  fileUrlToResolvedPrefixPath,
  fileUrlToModulePath,
} from "@greenwood/cli/src/lib/resource-utils.js";

const compilerRoot = getPackageRoot("wc-compiler", import.meta.url);
const pluginImports = {
  "signal-polyfill": new URL(
    "./dist/index.js",
    getPackageRoot("signal-polyfill", new URL("./package.json", compilerRoot)),
  ),
  "wc-compiler/effect": new URL("./src/effect.js", compilerRoot),
};
const importMap = Object.fromEntries(
  Object.entries(pluginImports).map(([specifier, url]) => [
    specifier,
    fileUrlToResolvedPrefixPath(url),
  ]),
);

// Rewrite only import/export sources, leaving strings and component text unchanged.
function resolvePluginImports(tree) {
  const resolveSource = (node) => {
    const specifier = node.source?.value;
    const url = Object.hasOwn(pluginImports, specifier) ? pluginImports[specifier] : null;

    if (url) {
      node.source.value = fileUrlToModulePath(url);
      delete node.source.raw;
    }
  };

  for (const node of tree.body) {
    if (
      ["ImportDeclaration", "ExportNamedDeclaration", "ExportAllDeclaration"].includes(node.type)
    ) {
      resolveSource(node);
    }
  }
}

class ImportJsxResource {
  constructor(compilation, options) {
    this.compilation = compilation;
    this.extensions = ["jsx", "tsx"];
    this.contentType = "text/javascript";
    this.servePage = options.servePages ? "dynamic" : null;
    this.inferredObservability = options.inferredObservability;
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
    // Development uses import maps; pin runtime imports for bundling to the plugin's compiler installation.
    if (process.env.__GWD_COMMAND__ !== "develop") {
      resolvePluginImports(tree);
    }

    const result = generate(tree);

    return new Response(result, {
      headers: new Headers({
        "Content-Type": this.contentType,
      }),
    });
  }

  async shouldIntercept(url, request, response) {
    const matchingRoute = getMatchingPageByRoute(this.compilation, url.pathname);

    return (
      this.inferredObservability &&
      matchingRoute &&
      response.headers.get("Content-Type")?.indexOf("text/html") >= 0
    );
  }

  async intercept(url, request, response) {
    const { polyfills } = this.compilation.config;
    const body = await response.text();
    let newBody = body;
    const signalPolyfillSpecifier =
      process.env.__GWD_COMMAND__ === "develop"
        ? "signal-polyfill"
        : fileUrlToModulePath(pluginImports["signal-polyfill"]);

    if (process.env.__GWD_COMMAND__ === "develop") {
      newBody = mergeImportMap(newBody, { imports: importMap }, polyfills.importMaps);
    }

    const scriptType =
      process.env.__GWD_COMMAND__ === "develop" && polyfills.importMaps ? "module-shim" : "module";
    const signalScript = `<script type="${scriptType}">
      import { Signal } from '${signalPolyfillSpecifier}';
      globalThis.Signal = Signal;
    </script>`;

    newBody = insertAfterImportMap(newBody, signalScript);
    return new Response(newBody);
  }
}

/** @type {import('./types/index.d.ts').ImportJsxPlugin} */
const greenwoodPluginImportJsx = (options = {}) => [
  {
    type: "resource",
    name: "plugin-import-jsx:resource",
    provider: (compilation) =>
      new ImportJsxResource(compilation, {
        servePages: true,
        ...options,
      }),
  },
];

export { greenwoodPluginImportJsx };
