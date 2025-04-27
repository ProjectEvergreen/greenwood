import fs from "fs/promises";
import toc from "markdown-toc";
import rehypeStringify from "rehype-stringify";
import rehypeRaw from "rehype-raw";
import remarkFrontmatter from "remark-frontmatter";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

// unless we want to support hot reloading?
// https://github.com/ProjectEvergreen/greenwood/issues/1278
let allHeadingsTracked = false;

async function trackAllTocHeadings(compilation) {
  for (const idx in compilation.graph) {
    const page = compilation.graph[idx];

    if (page.pageHref.endsWith(".md")) {
      const markdownContents = await fs.readFile(new URL(page.pageHref), "utf-8");

      let tocData = {};

      tocData.tocHeading = page.data.tocHeading || 0;
      tocData.tableOfContents = [];

      if (page.data.tocHeading > 0 && page.data.tocHeading <= 6) {
        tocData.tableOfContents = toc(markdownContents).json;

        // parse table of contents for only the headings user wants linked
        if (tocData.tableOfContents.length > 0 && tocData.tocHeading > 0) {
          tocData.tableOfContents = tocData.tableOfContents.filter(
            (item) => item.lvl === tocData.tocHeading,
          );

          compilation.graph[idx].data = {
            ...page.data,
            ...tocData,
          };
        }
      }
    }
  }

  allHeadingsTracked = true;
}

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
      // TODO do we even need this plugin anymore?
      .use(remarkFrontmatter) // extract frontmatter from AST
      .use(remarkPlugins) // apply userland remark plugins
      .use(remarkRehype, { allowDangerousHtml: true }) // convert from markdown to HTML AST
      .use(rehypeRaw) // support mixed HTML in markdown
      .use(rehypePlugins) // apply userland rehype plugins
      .use(rehypeStringify) // convert AST to HTML string
      .process(markdownContents);

    // would be nice if there was a cleaner way to hook into Greenwood's "graph" lifecycle
    if (!allHeadingsTracked) {
      await trackAllTocHeadings(this.compilation);
    }

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
