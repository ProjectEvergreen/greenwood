/*
 *
 * Sitemap
 *
 */

import { ResourceInterface } from '../../lib/resource-interface.js';

class SitemapResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
  }
  
  async shouldServe(url) {
    return url.pathname.endsWith('sitemap.xml')
  }
  

  async serve(url) {

    //TODO:  check if module exists

    const { projectDirectory } = compilation.context;

    try {
      const sitemapModule = await import(`${projectDirectory}/src/sitemap.xml.js`);
      const sitemap = await sitemapModule.generateSitemap(this.compilation);
      return new Response(sitemap, { headers: { 'Content-Type': 'text/xml' } });

    } catch (error) {
      console.error('Error loading module: ./sitemap.xml.js', error);
      return new Response("<error>Sitemap oops.</error>", { headers: { 'Content-Type': 'text/xml' } });
    }
    
  }

}

const greenwoodPluginResourceSitemap = {
  type: 'resource',
  name: 'plugin-sitemap',
  provider: (compilation, options) => new SitemapResource(compilation, options)
};

export { greenwoodPluginResourceSitemap };





