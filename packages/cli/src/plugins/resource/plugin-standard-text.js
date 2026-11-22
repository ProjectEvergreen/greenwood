/*
 *
 * Manages web standard resource related operations for plain text.
 * This is a Greenwood default plugin.
 *
 */
import fs from "node:fs/promises";
import { checkResourceExists } from "../../lib/resource-utils.js";

class StandardTextResource {
  constructor(compilation) {
    this.compilation = compilation;
    this.extensions = ["txt"];
    this.contentType = "text/plain";
  }

  async shouldServe(url) {
    return (
      url.protocol === "file:" &&
      this.extensions.includes(url.pathname.split(".").pop()) &&
      (await checkResourceExists(url))
    );
  }

  async serve(url) {
    const body = await fs.readFile(url);

    return new Response(body, {
      headers: new Headers({
        "Content-Type": this.contentType,
      }),
    });
  }
}

const greenwoodPluginStandardText = {
  type: "resource",
  name: "plugin-standard-text",
  provider: (compilation) => new StandardTextResource(compilation),
};

export { greenwoodPluginStandardText };
