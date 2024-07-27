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

const greenwoodPluginSitemap = {
  type: 'resource',
  name: 'plugin-resource-sitemap',
  provider: (compilation, options) => new SitemapResource(compilation, options)
};

export { greenwoodPluginSitemap };