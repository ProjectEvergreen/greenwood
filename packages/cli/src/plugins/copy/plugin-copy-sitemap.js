import { checkResourceExists } from "../../lib/resource-utils.js";
import fs from "node:fs/promises";

const greenwoodPluginCopySitemap = [
  {
    type: "copy",
    name: "plugin-copy-sitemap",
    provider: async (compilation) => {
      const fileName = "sitemap.xml";
      const { outputDir, scratchDir, userWorkspace } = compilation.context;
      const sitemapPathUrl = new URL(`./${fileName}`, userWorkspace);
      const sitemapModuleUrl = new URL(`./${fileName}.js`, userWorkspace);
      const assets = [];

      if (await checkResourceExists(sitemapPathUrl)) {
        assets.push({
          from: sitemapPathUrl,
          to: new URL(`./${fileName}`, outputDir),
        });
      } else if (await checkResourceExists(sitemapModuleUrl)) {
        // generate a dynamic sitemap from the user's sitemap.xml.js module
        // https://github.com/ProjectEvergreen/greenwood/issues/1232
        const { generateSitemap } = await import(sitemapModuleUrl.href);
        const sitemap = await generateSitemap(compilation);
        const sitemapScratchUrl = new URL(`./${fileName}`, scratchDir);

        await fs.writeFile(sitemapScratchUrl, sitemap, "utf-8");

        assets.push({
          from: sitemapScratchUrl,
          to: new URL(`./${fileName}`, outputDir),
        });
      }

      return assets;
    },
  },
];

export { greenwoodPluginCopySitemap };
