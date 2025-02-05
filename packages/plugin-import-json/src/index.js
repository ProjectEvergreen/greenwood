/*
 *
 * Manages web standard resource related operations for JSON.
 * This is a Greenwood default plugin.
 *
 */
class ImportJsonResource {
  constructor(compilation) {
    this.compilation = compilation;
    this.extensions = ["json"];
    this.contentType = "text/javascript";
  }

  async shouldIntercept(url) {
    const { pathname } = url;

    return (
      pathname.split(".").pop() === this.extensions[0] &&
      url.searchParams.has("type") &&
      url.searchParams.get("type") === this.extensions[0]
    );
  }

  async intercept(url, request, response) {
    const json = await response.json();
    const body = `export default ${JSON.stringify(json)}`;

    return new Response(body, {
      headers: new Headers({
        "Content-Type": this.contentType,
      }),
    });
  }
}

const greenwoodPluginImportJson = () => [
  {
    type: "resource",
    name: "plugin-import-json:resource",
    provider: (compilation) => new ImportJsonResource(compilation),
  },
];

export { greenwoodPluginImportJson };
