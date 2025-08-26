/*
 *
 * Manages web standard resource related operations for fonts.
 * This is a Greenwood default plugin.
 *
 */
import fs from "node:fs/promises";

class StandardFontResource {
  constructor(compilation) {
    this.compilation = compilation;

    // https://developer.mozilla.org/en-US/docs/Learn/CSS/Styling_text/Web_fonts
    this.extensions = ["woff2", "woff", "ttf", "eot"];
  }

  async shouldServe(url) {
    const { pathname, protocol } = url;

    return this.extensions.indexOf(pathname.split(".").pop()) >= 0 && protocol === "file:";
  }

  async serve(url) {
    const extension = url.pathname.split(".").pop();
    const contentType = extension === "eot" ? "application/vnd.ms-fontobject" : `font/${extension}`;
    const body = await fs.readFile(url);

    return new Response(body, {
      headers: new Headers({
        "Content-Type": contentType,
      }),
    });
  }
}

const pluginGreenwoodStandardFont = {
  type: "resource",
  name: "plugin-standard-font",
  provider: (compilation) => new StandardFontResource(compilation),
};

export { pluginGreenwoodStandardFont };
