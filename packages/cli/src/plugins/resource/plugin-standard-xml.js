/*
 *
 * Manages web standard resource related operations for XML.
 * This is a Greenwood default plugin.
 *
 */
import fs from "node:fs/promises";
import { checkResourceExists } from "../../lib/resource-utils.js";

class StandardXmlResource {
  constructor(compilation) {
    this.compilation = compilation;
    this.extensions = ["xml"];
    this.contentType = "application/xml";
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
      headers: {
        "Content-Type": this.contentType,
      },
    });
  }
}

const greenwoodPluginStandardXml = {
  type: "resource",
  name: "plugin-standard-xml",
  provider: (compilation) => new StandardXmlResource(compilation),
};

export { greenwoodPluginStandardXml };
