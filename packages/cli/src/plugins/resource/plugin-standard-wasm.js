/*
 *
 * Manages web standard resource related operations for WASM.
 * This is a Greenwood default plugin.
 *
 */
import fs from "node:fs/promises";

class StandardWasmResource {
  constructor(compilation) {
    this.compilation = compilation;
    this.extensions = ["wasm"];
    this.contentType = "application/wasm";
  }

  async shouldServe(url) {
    return url.protocol === "file:" && this.extensions.includes(url.pathname.split(".").pop());
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

const greenwoodPluginStandardWasm = {
  type: "resource",
  name: "plugin-standard-wasm:resource",
  provider: (compilation) => new StandardWasmResource(compilation),
};

export { greenwoodPluginStandardWasm };
