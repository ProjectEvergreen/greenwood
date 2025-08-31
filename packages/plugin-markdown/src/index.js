import fs from "node:fs/promises";
import toc from "markdown-toc";
import rehypeStringify from "rehype-stringify";
import rehypeRaw from "rehype-raw";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

// unless we want to support hot reloading?
// https://github.com/ProjectEvergreen/greenwood/issues/1278
let allHeadingsTracked = false;

const PLUGIN_EXTENSION = "md";

async function trackAllTocHeadings(compilation) {
  for (const idx in compilation.graph) {
    const page = compilation.graph[idx];

    if (page?.pageHref?.endsWith(PLUGIN_EXTENSION)) {
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
    this.extensions = [PLUGIN_EXTENSION];
    this.contentType = "text/html";
    this.servePage = "static";
    this.options = options;
  }

  async shouldServe(url) {
    const { pathname } = url;
    const hasMatchingPageRoute = this.compilation.graph.find((node) => node.route === pathname);

    return hasMatchingPageRoute?.pageHref?.endsWith(`.${PLUGIN_EXTENSION}`);
  }

  async serve(url) {
    const { pathname } = url;
    const matchingPageRoute = this.compilation.graph.find((node) => node.route === pathname);
    const markdownContents = await fs.readFile(new URL(matchingPageRoute.pageHref), "utf-8");
    const rehypePlugins = [];
    const remarkPlugins = [];
    let processedMarkdown = "";
    let html = "";

    for (const plugin of this.options?.plugins || []) {
      const name = typeof plugin === "string" ? plugin : plugin.name;
      const options = plugin?.options ?? null;
      const pluginTypeArray = name.indexOf("rehype-") >= 0 ? rehypePlugins : remarkPlugins;
      const pluginImport = (await import(name)).default;

      if (options) {
        pluginTypeArray.push([pluginImport, options]);
      } else {
        pluginTypeArray.push(pluginImport);
      }
    }

    processedMarkdown = await unified()
      .use(remarkParse) // parse markdown into AST
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

    html = String(processedMarkdown);

    // remove markdown wrapping custom elements in <p></p> tags
    // https://github.com/ProjectEvergreen/greenwood/discussions/1267
    const wrappedCustomElementRegex =
      /<p><[a-zA-Z]*-[a-zA-Z](.*)>(.*)<\/[a-zA-Z]*-[a-zA-Z](.*)><\/p>/g;
    const ceTest = wrappedCustomElementRegex.test(html);

    if (ceTest) {
      const ceMatches = html.match(wrappedCustomElementRegex);

      ceMatches.forEach((match) => {
        const stripWrappingTags = match.replace("<p>", "").replace("</p>", "");

        html = html.replace(match, stripWrappingTags);
      });
    }

    return new Response(html, {
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
