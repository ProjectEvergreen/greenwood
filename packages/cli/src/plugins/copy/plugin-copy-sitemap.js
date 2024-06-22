import { checkResourceExists } from '../../lib/resource-utils.js';

const greenwoodPluginCopySitemap = [{
  type: 'copy',
  name: 'plugin-copy-sitemap',
  provider: async (compilation) => {
    const fileName = 'sitemap.xml';
    const { outputDir, userWorkspace } = compilation.context;
    const sitemapPathUrl = new URL(`./${fileName}`, userWorkspace);
    const assets = [];

    if (await checkResourceExists(sitemapPathUrl)) {
      assets.push({
        from: sitemapPathUrl,
        to: new URL(`./${fileName}`, outputDir)
      });
    }

    return assets;
  }
}];

export { greenwoodPluginCopySitemap };