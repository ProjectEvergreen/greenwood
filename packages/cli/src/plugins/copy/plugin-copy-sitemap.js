import { checkResourceExists } from "@greenwood/cli/src/lib/resource-utils.js";
import fs from 'fs/promises';


async function writeSitemap(compilation) {
    try {
      const { scratchDir, projectDirectory } = compilation.context;
      const adapterScratchUrl = new URL('./sitemap.xml', scratchDir);
  
      // Check if module exists
      const sitemapModule = await import(`${projectDirectory}/src/sitemap.xml.js`);
      const sitemap = await sitemapModule.generateSitemap(compilation);
  
      await fs.writeFile(adapterScratchUrl, sitemap);
      console.info('Wrote sitemap to ./sitemap.xml');

      return adapterScratchUrl;
    } catch (error) {
      console.error('Error in sitemapAdapter:', error);
    }
  }



const greenwoodPluginCopySitemap = [{
  type: 'copy',
  name: 'plugin-copy-sitemap',
  provider: async (compilation) => {

    const { outputDir } = compilation.context;
    const sitemapScratchUrl = await writeSitemap(compilation);

    return [{
        from: sitemapScratchUrl,
        to: new URL('./sitemap.xml', outputDir)
    }];
  }
}];

export { greenwoodPluginCopySitemap };