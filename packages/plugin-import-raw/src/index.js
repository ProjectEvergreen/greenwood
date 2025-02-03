/*
 *
 * Enables using JavaScript to import any type of file as a string using ESM syntax.
 *
 */
import { ResourceInterface } from "@greenwood/cli/src/lib/resource-interface.js";
import { IMPORT_MAP_RESOLVED_PREFIX } from "@greenwood/cli/src/lib/walker-package-ranger.js";

class ImportRawResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);

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
    const params = url.searchParams.size > 0 ? `${searchParams.toString()}&type=raw` : "type=raw";
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

const greenwoodPluginImportRaw = (options = {}) => {
  return [
    {
      type: "resource",
      name: "plugin-import-raw:resource",
      provider: (compilation) => new ImportRawResource(compilation, options),
    },
  ];
};

export { greenwoodPluginImportRaw };
