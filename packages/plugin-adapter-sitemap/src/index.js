import fs from 'fs/promises';


async function sitemapAdapter(compilation) {
  try {
    const { outputDir, projectDirectory } = compilation.context;
    const adapterOutputUrl = new URL('./sitemap.xml', outputDir);

    // Check if module exists
    const sitemapModule = await import(`${projectDirectory}/src/sitemap.xml.js`);
    const sitemap = await sitemapModule.generateSitemap(compilation);

    await fs.writeFile(adapterOutputUrl, sitemap);
    console.info('Wrote sitemap to ./sitemap.xml');
  } catch (error) {
    console.error('Error in sitemapAdapter:', error);
  }
}

const greenwoodPluginAdapterSitemap = (options = {}) => [{
  type: 'adapter',
  name: 'plugin-adapter-sitemap',
  provider: (compilation) => {
    return async () => {
      await sitemapAdapter(compilation, options);
    };
  }
}];

export { greenwoodPluginAdapterSitemap };