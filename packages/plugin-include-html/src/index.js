import fs from "node:fs/promises";

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
    let body = await response.text();
    const includeLinksRegexMatches = body.match(/<link (.*)>/g);
    const includeCustomElementsRegexMatches = body.match(
      /<[a-zA-Z]*-[a-zA-Z](.*)>(.*)<\/[a-zA-Z]*-[a-zA-Z](.*)>/g,
    );

    if (includeLinksRegexMatches) {
      const htmlIncludeLinks = includeLinksRegexMatches.filter(
        (link) => link.indexOf('rel="html"') > 0,
      );

      for (const link of htmlIncludeLinks) {
        const href = link.match(/href="(.*)"/)[1];
        const prefix = href.startsWith("/") ? "." : "";
        const includeContents = await fs.readFile(
          new URL(`${prefix}${href}`, this.compilation.context.userWorkspace),
          "utf-8",
        );

        body = body.replace(link, includeContents);
      }
    }

    if (includeCustomElementsRegexMatches) {
      const customElementTags = includeCustomElementsRegexMatches.filter(
        (customElementTag) => customElementTag.indexOf("src=") > 0,
      );

      for (const tag of customElementTags) {
        const src = tag.match(/src="(.*)"/)[1];
        const srcUrl = new URL(
          `./${src.replace(/\.\.\//g, "")}`,
          this.compilation.context.userWorkspace,
        );
        // @ts-expect-error see https://github.com/microsoft/TypeScript/issues/42866
        const { getData, getTemplate } = await import(srcUrl);
        const includeContents = await getTemplate(await getData());

        body = body.replace(tag, includeContents);
      }
    }

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
