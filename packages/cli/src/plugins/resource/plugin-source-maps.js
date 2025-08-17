/*
 *
 * Detects and fully resolve requests to source map (.map) files.
 *
 */
import { checkResourceExists } from "../../lib/resource-utils.js";
import fs from "node:fs/promises";

class SourceMapsResource {
  constructor(compilation) {
    this.compilation = compilation;
    this.extensions = ["map"];
    this.contentType = "application/json";
  }

  async shouldServe(url) {
    return url.pathname.split(".").pop() === this.extensions[0] && (await checkResourceExists(url));
  }

  async serve(url) {
    const body = await fs.readFile(url, "utf-8");

    return new Response(body, {
      statusText: "OK",
      headers: new Headers({
        "Content-Type": this.contentType,
      }),
    });
  }
}

const greenwoodPluginSourceMaps = {
  type: "resource",
  name: "plugin-source-maps",
  provider: (compilation) => new SourceMapsResource(compilation),
};

export { greenwoodPluginSourceMaps };
