/*
 *
 * Enables using JavaScript to import any type of file as a string using ESM syntax.
 *
 */
import { IMPORT_MAP_RESOLVED_PREFIX } from "@greenwood/cli/src/lib/walker-package-ranger.js";
import { getImportMap, mergeImportMap } from "@greenwood/cli/src/lib/node-modules-utils.js";
import { getMatchingPageByRoute } from "@greenwood/cli/src/lib/graph-utils.js";

// a ?type=text aliases for the configured file extensions, preserving other query parameters and fragments.
function generateImportMapExtensionsMap(imports = {}, extensions = []) {
  const aliases = {};

  for (const [specifier, target] of Object.entries(imports)) {
    const ext = specifier.split(/[?#]/)[0].split(".").pop();

    if (extensions.includes(ext)) {
      const [textSpecifier, textTarget] = [specifier, target].map((value) => {
        const url = new URL(value, "http://localhost/");
        url.searchParams.set("type", "text");

        return `${value.split(/[?#]/)[0]}${url.search}${url.hash}`;
      });

      aliases[textSpecifier] = textTarget;
    }
  }

  return aliases;
}

class ImportMapExtensionsResourcePlugin {
  compilation;
  options;

  constructor(compilation, options) {
    this.compilation = compilation;
    this.options = options;
  }

  async shouldIntercept(url, request, response) {
    const { protocol, pathname } = url;
    const hasMatchingPageRoute = getMatchingPageByRoute(this.compilation, pathname);

    return (
      this.options?.importMapExtensions?.length > 0 &&
      process.env.__GWD_COMMAND__ === "develop" &&
      protocol.startsWith("http") &&
      hasMatchingPageRoute &&
      response.headers.get("content-type")?.indexOf("text/html") >= 0
    );
  }

  async intercept(url, request, response) {
    const body = await response.text();
    const { imports, scopes = {} } = getImportMap(body);
    const extensions = this.options.importMapExtensions;
    const scopedAliases = Object.fromEntries(
      Object.entries(scopes).map(([scope, entries]) => [
        scope,
        generateImportMapExtensionsMap(entries, extensions),
      ]),
    );
    const newBody = mergeImportMap(
      body,
      { imports: generateImportMapExtensionsMap(imports, extensions), scopes: scopedAliases },
      this.compilation.config.polyfills.importMaps,
    );

    return new Response(newBody);
  }
}

class ImportTextResource {
  constructor(compilation, options) {
    this.compilation = compilation;
    this.options = options;
    this.contentType = "text/javascript";
  }

  async shouldResolve(url) {
    const { href, searchParams } = url;
    const matches = (this.options.matches || []).filter((matcher) => href.indexOf(matcher) >= 0);

    if (matches.length > 0 && !searchParams.has("type")) {
      return true;
    }
  }

  async resolve(url) {
    const { searchParams, href, pathname } = url;
    const params = url.searchParams.size > 0 ? `${searchParams.toString()}&type=text` : "type=text";
    const fromImportMap = pathname.startsWith(IMPORT_MAP_RESOLVED_PREFIX);
    const resolvedHref = fromImportMap
      ? pathname.replace(IMPORT_MAP_RESOLVED_PREFIX, "file://")
      : href;
    const matchedUrl = new URL(`${resolvedHref}?${params}`);

    return new Request(matchedUrl);
  }

  async shouldIntercept(url) {
    const matches = (this.options.matches || []).filter(
      (matcher) => url.href.indexOf(matcher) >= 0,
    );
    const type = url.searchParams.get("type");

    return (url.protocol === "file:" && type === "text") || matches.length > 0;
  }

  async intercept(url, request, response) {
    const body = await response.text();
    const contents = `const text = \`${body.replace(/\r?\n|\r/g, " ").replace(/\\/g, "\\\\")}\`;\nexport default text;`;

    return new Response(contents, {
      headers: new Headers({
        "Content-Type": this.contentType,
      }),
    });
  }
}

/** @type {import('./types/index.d.ts').ImportTextPlugin} */
const greenwoodPluginImportText = (options = {}) => {
  return [
    {
      type: "resource",
      name: "plugin-import-text-transform:resource",
      provider: (compilation) => new ImportTextResource(compilation, options),
    },
    {
      type: "resource",
      name: "plugin-import-text-extensions:resource",
      provider: (compilation) => new ImportMapExtensionsResourcePlugin(compilation, options),
    },
  ];
};

export { greenwoodPluginImportText };
