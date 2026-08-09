import fs from "node:fs/promises";

const DEFAULT_FILENAME = "rss.xml";

function escapeEntities(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getPageDate(page) {
  const raw = page.data?.published ?? page.data?.date;
  const date = raw ? new Date(raw) : null;

  return date && !isNaN(date.valueOf()) ? date : null;
}

function getFeedPages(compilation, options) {
  const { collection } = options;
  const { basePath } = compilation.config;
  const pages = collection
    ? (compilation.collections?.[collection] ?? [])
    : compilation.graph.filter((page) => page.route !== `${basePath}/404/`);

  return [...pages].sort((pageA, pageB) => {
    const dateA = getPageDate(pageA);
    const dateB = getPageDate(pageB);

    // newest first; undated pages keep their graph order at the end
    if (!dateA && !dateB) {
      return 0;
    } else if (!dateA) {
      return 1;
    } else if (!dateB) {
      return -1;
    }

    return dateB.valueOf() - dateA.valueOf();
  });
}

function generateRssFeed(compilation, options) {
  const { title, description, link, maxItems } = options;
  const channelLink = link.replace(/\/$/, "");
  let pages = getFeedPages(compilation, options);

  if (maxItems) {
    pages = pages.slice(0, maxItems);
  }

  const items = pages
    .map((page) => {
      const itemTitle = page.title ?? page.label;
      const itemLink = `${channelLink}${page.route}`;
      const itemDescription = page.data?.description;
      const itemDate = getPageDate(page);

      return [
        "    <item>",
        `      <title>${escapeEntities(itemTitle)}</title>`,
        `      <link>${escapeEntities(itemLink)}</link>`,
        `      <guid>${escapeEntities(itemLink)}</guid>`,
        itemDescription
          ? `      <description>${escapeEntities(itemDescription)}</description>`
          : null,
        itemDate ? `      <pubDate>${itemDate.toUTCString()}</pubDate>` : null,
        "    </item>",
      ]
        .filter((line) => line !== null)
        .join("\n");
    })
    .join("\n");

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<rss version="2.0">`,
    "  <channel>",
    `    <title>${escapeEntities(title)}</title>`,
    `    <link>${escapeEntities(channelLink)}</link>`,
    `    <description>${escapeEntities(description)}</description>`,
    items,
    "  </channel>",
    "</rss>",
  ]
    .filter((section) => section !== "")
    .join("\n");
}

class RssFeedResource {
  constructor(compilation, options = {}) {
    this.compilation = compilation;
    this.options = options;
    this.contentType = "application/rss+xml";
  }

  async shouldServe(url) {
    const { basePath } = this.compilation.config;
    const filename = this.options.filename ?? DEFAULT_FILENAME;

    return url.pathname === `${basePath}/${filename}`;
  }

  async serve() {
    const feed = generateRssFeed(this.compilation, this.options);

    return new Response(feed, {
      headers: new Headers({
        "Content-Type": this.contentType,
      }),
    });
  }
}

/** @type {import('./types/index.d.ts').RssPlugin} */
const greenwoodPluginRss = (options = {}) => {
  // title, link, and description are the required channel elements of RSS 2.0
  // https://www.rssboard.org/rss-specification#requiredChannelElements
  ["title", "link", "description"].forEach((key) => {
    if (!options[key] || typeof options[key] !== "string") {
      throw new Error(
        `Error: ${key} should be of type string.  got "${typeof options[key]}" instead.`,
      );
    }
  });

  return [
    {
      type: "copy",
      name: "plugin-rss:copy",
      provider: async (compilation) => {
        const { outputDir, scratchDir } = compilation.context;
        const filename = options.filename ?? DEFAULT_FILENAME;
        const feedScratchUrl = new URL(`./${filename}`, scratchDir);

        await fs.writeFile(feedScratchUrl, generateRssFeed(compilation, options));

        return [
          {
            from: feedScratchUrl,
            to: new URL(`./${filename}`, outputDir),
          },
        ];
      },
    },
    {
      type: "resource",
      name: "plugin-rss:resource",
      provider: (compilation) => new RssFeedResource(compilation, options),
    },
  ];
};

export { greenwoodPluginRss };
