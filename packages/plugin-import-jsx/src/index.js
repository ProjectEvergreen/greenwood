/*
 *
 * Compile Web Components rendering with JSX using wc-compiler.
 *
 */
import { generate } from "astring";
import { parseJsx } from "wc-compiler/jsx-loader";
import { mergeImportMap } from "@greenwood/cli/src/lib/node-modules-utils.js";
import { getMatchingPageByRoute } from "@greenwood/cli/src/lib/graph-utils.js";
import { normalizePathnameForWindows } from "@greenwood/cli/src/lib/resource-utils.js";
import {
  derivePackageRoot,
  IMPORT_MAP_RESOLVED_PREFIX,
  resolveBareSpecifier,
} from "@greenwood/cli/src/lib/walker-package-ranger.js";
import { parse } from "node-html-parser";

const pluginImports = {
  "signal-polyfill": new URL(
    "./dist/index.js",
    derivePackageRoot(resolveBareSpecifier("signal-polyfill", import.meta.url)),
  ),
  "wc-compiler/effect": new URL(
    "./src/effect.js",
    derivePackageRoot(resolveBareSpecifier("wc-compiler", import.meta.url)),
  ),
};
const importMap = Object.fromEntries(
  Object.entries(pluginImports).map(([specifier, url]) => [
    specifier,
    `${IMPORT_MAP_RESOLVED_PREFIX}${url.pathname}`,
  ]),
);

function resolvePluginImports(contents) {
  let resolvedContents = contents;

  for (const [specifier, url] of Object.entries(pluginImports)) {
    resolvedContents = resolvedContents.replaceAll(specifier, normalizePathnameForWindows(url));
  }

  return resolvedContents;
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
    const generated = generate(tree);
    const result =
      process.env.__GWD_COMMAND__ === "develop" ? generated : resolvePluginImports(generated);

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
        : normalizePathnameForWindows(pluginImports["signal-polyfill"]);

    if (process.env.__GWD_COMMAND__ === "develop") {
      newBody = mergeImportMap(newBody, importMap, polyfills.importMaps);
    }

    const root = parse(newBody);
    const signalScript = parse(`
      <script type="module">
        import { Signal } from '${signalPolyfillSpecifier}';
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
