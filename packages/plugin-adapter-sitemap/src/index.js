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

/*
 *
 * Sitemap
 *
 */

import { ResourceInterface } from '@greenwood/cli/src/lib/resource-interface.js';

class SitemapResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
  }

  async shouldServe(url) {
    return url.pathname.endsWith('sitemap.xml');
  }

  // eslint-disable-next-line no-unused-vars
  async serve(url) {

    const { projectDirectory } = this.compilation.context;

    try {
      const sitemapModule = await import(`${projectDirectory}/src/sitemap.xml.js`);
      const sitemap = await sitemapModule.generateSitemap(this.compilation);
      return new Response(sitemap, { headers: { 'Content-Type': 'text/xml' } });

    } catch (error) {
      console.error('Error loading module: ./sitemap.xml.js  Does it exist?', error);
      return new Response('<error>Sitemap oops.</error>', { headers: { 'Content-Type': 'text/xml' } });
    }

  }

}

const greenwoodPluginResourceSitemap = {
  type: 'resource',
  name: 'plugin-sitemap',
  provider: (compilation, options) => new SitemapResource(compilation, options)
};

export { greenwoodPluginResourceSitemap };
export { greenwoodPluginAdapterSitemap };