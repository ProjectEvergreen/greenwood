import fs from "node:fs/promises";
import { parseHtml } from "@greenwood/cli/src/lib/html-utils.js";

class IncludeHtmlResource {
  constructor(compilation) {
    this.compilation = compilation;
    this.extensions = [".html"];
    this.contentType = "text/html";
  }

  async shouldIntercept(url, request, response) {
    return response.headers.get("Content-Type")?.indexOf(this.contentType) >= 0;
  }

  async intercept(url, request, response) {
    const root = parseHtml(await response.text());
    const links = root.querySelectorAll('link[rel="html"]');
    const customElements = root
      .querySelectorAll("[src]")
      .filter((node) => node.localName.includes("-"));

    for (const link of links) {
      const href = link.getAttribute("href");
      const prefix = href.startsWith("/") ? "." : "";
      const contents = await fs.readFile(
        new URL(`${prefix}${href}`, this.compilation.context.userWorkspace),
        "utf-8",
      );
      link.replaceWith(...parseHtml(contents).childNodes);
    }

    for (const tag of customElements) {
      const src = tag.getAttribute("src");
      const srcUrl = new URL(
        `./${src.replace(/\.\.\//g, "")}`,
        this.compilation.context.userWorkspace,
      );
      // @ts-expect-error see https://github.com/microsoft/TypeScript/issues/42866
      const { getData, getTemplate } = await import(srcUrl);
      tag.replaceWith(...parseHtml(await getTemplate(await getData())).childNodes);
    }
    const body = root.toString();

    return new Response(body, {
      headers: response.headers,
    });
  }
}

/** @type {import('./types/index.d.ts').IncludeHtmlPlugin} */
const greenwoodPluginIncludeHTML = () => [
  {
    type: "resource",
    name: "plugin-include-html",
    provider: (compilation) => new IncludeHtmlResource(compilation),
  },
];

export { greenwoodPluginIncludeHTML };
