import { mergeImportMap } from '../../lib/walker-package-ranger.js';
import { ResourceInterface } from '../../lib/resource-interface.js';
import { activeGreenwoodFrontmatterKeys, cleanContentCollection } from '../../lib/content-utils.js';

const importMap = {
  '@greenwood/cli/src/data/client.js': '/node_modules/@greenwood/cli/src/data/client.js'
};

class ContentAsDataResource extends ResourceInterface {
  constructor(compilation, options = {}) {
    super(compilation, options);

    this.contentType = ['text/html'];
  }

  async shouldIntercept(url, request, response) {
    const { activeFrontmatter, contentAsData } = this.compilation.config;

    return response.headers.get('Content-Type')?.indexOf(this.contentType[0]) >= 0
      && (activeFrontmatter || contentAsData);
  }

  async intercept(url, request, response) {
    const { activeFrontmatter, contentAsData, polyfills } = this.compilation.config;
    const body = await response.text();
    let newBody = body;

    if (process.env.__GWD_COMMAND__ === 'develop' && contentAsData) { // eslint-disable-line no-underscore-dangle
      newBody = mergeImportMap(body, importMap, polyfills.importMaps);
      newBody = newBody.replace('<head>', `
        <head>
          <script id="content-server">
            globalThis.__CONTENT_SERVER__ = globalThis.__CONTENT_SERVER__
              ? globalThis.__CONTENT_SERVER__
              : {
                  PORT: "${this.compilation.config.port + 1}"
                }
          </script>
      `);
    }

    if (activeFrontmatter) {
      const matchingRoute = this.compilation.graph.find(page => page.route === url.pathname);

      // Greenwood default graph data
      for (const key of activeGreenwoodFrontmatterKeys) {
        const interpolatedFrontmatter = '\\$\\{globalThis.page.' + key + '\\}';
        const needle = key === 'title' && !matchingRoute.title
          ? matchingRoute.label
          : matchingRoute[key];

        newBody = newBody.replace(new RegExp(interpolatedFrontmatter, 'g'), needle);
      }

      // custom user frontmatter data
      for (const fm in matchingRoute.data) {
        const interpolatedFrontmatter = '\\$\\{globalThis.page.data.' + fm + '\\}';
        const needle = typeof matchingRoute.data[fm] === 'string' ? matchingRoute.data[fm] : JSON.stringify(matchingRoute.data[fm]).replace(/"/g, '&quot;');

        newBody = newBody.replace(new RegExp(interpolatedFrontmatter, 'g'), needle);
      }

      // collections
      for (const collection in this.compilation.collections) {
        const interpolatedFrontmatter = '\\$\\{globalThis.collection.' + collection + '\\}';
        const cleanedCollections = cleanContentCollection(this.compilation.collections[collection]);

        newBody = newBody.replace(new RegExp(interpolatedFrontmatter, 'g'), JSON.stringify(cleanedCollections).replace(/"/g, '&quot;'));
      }
    }

    // TODO how come we need to forward headers, shouldn't mergeResponse do that for us?
    return new Response(newBody, {
      headers: response.headers
    });
  }

  async shouldOptimize(url, response) {
    const { contentAsData } = this.compilation.config;

    return response.headers.get('Content-Type').indexOf(this.contentType[0]) >= 0 && contentAsData;
  }

  async optimize(url, response) {
    let body = await response.text();

    body = body.replace('<head>', `
      <head>
        <script id="content-state">
          globalThis.__CONTENT_AS_DATA_STATE__ = true;
        </script>
    `);

    return new Response(body);
  }
}

const greenwoodPluginContentAsData = {
  type: 'resource',
  name: 'plugin-content-as-data:resource',
  provider: (compilation) => new ContentAsDataResource(compilation)
};

export { greenwoodPluginContentAsData };