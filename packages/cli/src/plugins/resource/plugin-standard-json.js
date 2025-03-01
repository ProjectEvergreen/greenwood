/*
 *
 * Manages web standard resource related operations for JSON.
 * This is a Greenwood default plugin.
 *
 */
import { checkResourceExists } from "../../lib/resource-utils.js";
import fs from "fs/promises";

class StandardJsonResource {
  constructor(compilation) {
    this.compilation = compilation;
    this.extensions = ["json"];
    this.contentType = "application/json";
  }

  async shouldServe(url) {
    const { protocol, pathname } = url;
    const isJson = pathname.split(".").pop() === this.extensions[0];
    const isLocalFile = protocol === "file:" && (await checkResourceExists(url));

    return isJson && isLocalFile;
  }

  async serve(url) {
    const contents = await fs.readFile(url, "utf-8");

    return new Response(contents, {
      headers: new Headers({
        "Content-Type": this.contentType,
      }),
    });
  }

  async shouldIntercept(url, request) {
    const { protocol, pathname, searchParams } = url;
    const ext = pathname.split(".").pop();

    return (
      protocol === "file:" &&
      ext === this.extensions[0] &&
      !searchParams.has("type") &&
      (request.headers.get("Accept")?.indexOf("text/javascript") >= 0 ||
        url.searchParams?.get("polyfill") === "type-json")
    );
  }

  async intercept(url, request, response) {
    const json = await response.json();
    const body = `export default ${JSON.stringify(json)}`;

    return new Response(body, {
      headers: {
        "Content-Type": "text/javascript",
      },
    });
  }
}

const pluginGreenwoodStandardJson = [
  {
    type: "resource",
    name: "plugin-standard-json:resource",
    provider: (compilation) => new StandardJsonResource(compilation),
  },
];

export { pluginGreenwoodStandardJson };
