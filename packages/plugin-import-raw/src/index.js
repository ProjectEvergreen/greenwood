/*
 *
 * Enables using JavaScript to import any type of file as a string using ESM syntax.
 *
 */
import {
  isPackageResourcePath,
  resolveResourceUrl,
  mergeImportMap,
  getImportMap,
} from "@greenwood/cli/src/lib/node-modules-utils.js";
import { getMatchingPageByRoute } from "@greenwood/cli/src/lib/graph-utils.js";

function withRawType(value) {
  const url = new URL(value, "http://localhost/");
  url.searchParams.set("type", "raw");

  return `${value.split(/[?#]/)[0]}${url.search}${url.hash}`;
}

function generateImportMapExtensionsMap(imports = {}, extensions = []) {
  const aliases = {};

  for (const [specifier, target] of Object.entries(imports)) {
    const ext = specifier.split(/[?#]/)[0].split(".").pop();

    if (extensions.includes(ext)) {
      aliases[withRawType(specifier)] = withRawType(target);
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

class ImportRawResource {
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

  async resolve(url, request) {
    const matchedUrl = isPackageResourcePath(url.pathname)
      ? resolveResourceUrl(url.href, this.compilation.context.projectDirectory)
      : new URL(request?.url ?? url.href);
    matchedUrl.searchParams.set("type", "raw");

    return new Request(matchedUrl);
  }

  async shouldIntercept(url) {
    const matches = (this.options.matches || []).filter(
      (matcher) => url.href.indexOf(matcher) >= 0,
    );
    const type = url.searchParams.get("type");

    return (url.protocol === "file:" && type === "raw") || matches.length > 0;
  }

  async intercept(url, request, response) {
    const body = await response.text();
    const contents = `const raw = \`${body.replace(/\r?\n|\r/g, " ").replace(/\\/g, "\\\\")}\`;\nexport default raw;`;

    return new Response(contents, {
      headers: new Headers({
        "Content-Type": this.contentType,
      }),
    });
  }
}

/** @type {import('./types/index.d.ts').ImportRawPlugin} */
const greenwoodPluginImportRaw = (options = {}) => {
  return [
    {
      type: "resource",
      name: "plugin-import-raw-transform:resource",
      provider: (compilation) => new ImportRawResource(compilation, options),
    },
    {
      type: "resource",
      name: "plugin-import-raw-extensions:resource",
      provider: (compilation) => new ImportMapExtensionsResourcePlugin(compilation, options),
    },
  ];
};

export { greenwoodPluginImportRaw };
