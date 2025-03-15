import fs from "fs/promises";
import rehypeStringify from "rehype-stringify";
import rehypeRaw from "rehype-raw";
import remarkFrontmatter from "remark-frontmatter";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

class MarkdownResource {
  constructor(compilation, options = {}) {
    this.compilation = compilation;
    this.extensions = [".md"];
    this.contentType = "text/html";
    this.servePage = "static";
    this.options = options;
  }

  async shouldPreServe(url) {
    const { protocol, pathname } = url;
    const hasMatchingPageRoute = this.compilation.graph.find((node) => node.route === pathname);

    // console.log('shouldServe', { hasMatchingPageRoute, protocol, pathname });
    return (
      protocol.startsWith("http") &&
      hasMatchingPageRoute &&
      hasMatchingPageRoute.pageHref.endsWith(this.extensions[0])
    );
  }

  async preServe(url) {
    const { pathname } = url;
    const matchingPageRoute = this.compilation.graph.find((node) => node.route === pathname);
    const markdownContents = await fs.readFile(new URL(matchingPageRoute.pageHref), "utf-8");
    const rehypePlugins = [];
    const remarkPlugins = [];
    let processedMarkdown = "";

    for (const plugin of this.options?.plugins || []) {
      if (plugin.indexOf("rehype-") >= 0) {
        rehypePlugins.push((await import(plugin)).default);
      }

      if (plugin.indexOf("remark-") >= 0) {
        remarkPlugins.push((await import(plugin)).default);
      }
    }

    processedMarkdown = await unified()
      .use(remarkParse) // parse markdown into AST
      .use(remarkFrontmatter) // extract frontmatter from AST
      .use(remarkPlugins) // apply userland remark plugins
      .use(remarkRehype, { allowDangerousHtml: true }) // convert from markdown to HTML AST
      .use(rehypeRaw) // support mixed HTML in markdown
      .use(rehypePlugins) // apply userland rehype plugins
      .use(rehypeStringify) // convert AST to HTML string
      .process(markdownContents);

    // TODO
    // if (processedMarkdown) {
    //   const wrappedCustomElementRegex =
    //     /<p><[a-zA-Z]*-[a-zA-Z](.*)>(.*)<\/[a-zA-Z]*-[a-zA-Z](.*)><\/p>/g;
    //   const ceTest = wrappedCustomElementRegex.test(processedMarkdown.value);

    //   if (ceTest) {
    //     const ceMatches = processedMarkdown.value.match(wrappedCustomElementRegex);

    //     ceMatches.forEach((match) => {
    //       const stripWrappingTags = match.replace("<p>", "").replace("</p>", "");

    //       processedMarkdown.value = processedMarkdown.value.replace(match, stripWrappingTags);
    //     });
    //   }

    //   // https://github.com/ProjectEvergreen/greenwood/issues/1126
    //   body = body.replace(
    //     /<content-outlet>(.*)<\/content-outlet>/s,
    //     processedMarkdown.value.replace(/\$/g, "$$$"),
    //   );
    // }

    return new Response(processedMarkdown, {
      headers: new Headers({
        "Content-Type": this.contentType,
      }),
    });
  }
}

/** @type {import('./types/index.d.ts').MarkdownPlugin} */
const greenwoodPluginMarkdown = (options = {}) => [
  {
    type: "resource",
    name: "plugin-markdown",
    provider: (compilation) => new MarkdownResource(compilation, options),
  },
];

export { greenwoodPluginMarkdown };
