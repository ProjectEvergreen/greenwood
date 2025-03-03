/*
 *
 * Manages resource related operations for TypeScript.
 *
 * This is a Greenwood default plugin.
 *
 */
import amaro from "amaro";
import fs from "fs/promises";

class StandardTypeScriptResource {
  constructor(compilation) {
    this.compilation = compilation;
    this.extensions = ["ts"];
    this.contentType = "text/javascript";
  }

  async shouldServe(url) {
    return url.protocol === "file:" && this.extensions.includes(url.pathname.split(".").pop());
  }

  async serve(url) {
    const body = await fs.readFile(url, "utf-8");
    const { code } = amaro.transformSync(body);

    return new Response(code, {
      headers: {
        "Content-Type": this.contentType,
      },
    });
  }
}

const greenwoodPluginTypeScript = [
  {
    type: "resource",
    name: "plugin-typescript",
    provider: (compilation) => new StandardTypeScriptResource(compilation),
  },
];

export { greenwoodPluginTypeScript };
