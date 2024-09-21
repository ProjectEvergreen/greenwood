import { mergeImportMap } from '../../lib/walker-package-ranger.js';
import { ResourceInterface } from '../../lib/resource-interface.js';

const importMap = {
  '@greenwood/cli/src/data/client.js': '/node_modules/@greenwood/cli/src/data/client.js'
};

class ContentAsDataResource extends ResourceInterface {
  constructor(compilation, options = {}) {
    super(compilation, options);

    this.contentType = ['text/html'];
  }

  async shouldIntercept(url, request, response) {
    return response.headers.get('Content-Type')?.indexOf(this.contentType[0]) >= 0;
  }

  async intercept(url, request, response) {
    const { activeFrontmatter } = this.compilation.config;
    const body = await response.text();
    let newBody = body;

    if (process.env.__GWD_COMMAND__ === 'develop') { // eslint-disable-line no-underscore-dangle
      newBody = mergeImportMap(body, importMap, this.compilation.config.polyfills.importMaps);
    }

    if (activeFrontmatter) {
      const matchingRoute = this.compilation.graph.find(page => page.route === url.pathname);

      // custom user frontmatter data
      for (const fm in matchingRoute.data) {
        const interpolatedFrontmatter = '\\$\\{globalThis.page.data.' + fm + '\\}';
        const needle = typeof matchingRoute.data[fm] === 'string' ? matchingRoute.data[fm] : JSON.stringify(matchingRoute.data[fm]).replace(/"/g, '&quot;');

        newBody = newBody.replace(new RegExp(interpolatedFrontmatter, 'g'), needle);
      }

      // Greenwood default graph data
      const activeFrontmatterForwardKeys = ['route', 'label', 'title', 'id'];

      for (const key of activeFrontmatterForwardKeys) {
        const interpolatedFrontmatter = '\\$\\{globalThis.page.' + key + '\\}';
        const needle = key === 'title' && !matchingRoute.title
          ? matchingRoute.label
          : matchingRoute[key];

        newBody = newBody.replace(new RegExp(interpolatedFrontmatter, 'g'), needle);
      }

      for (const collection in this.compilation.collections) {
        const interpolatedFrontmatter = '\\$\\{globalThis.collection.' + collection + '\\}';

        newBody = newBody.replace(new RegExp(interpolatedFrontmatter, 'g'), JSON.stringify(this.compilation.collections[collection]).replace(/"/g, '&quot;'));
      }
    }

    // TODO how come we need to forward headers, shouldn't mergeResponse do that for us?
    return new Response(newBody, {
      headers: response.headers
    });
  }

  // TODO graphql based hydration?
  // async shouldOptimize(url, response) {
  //   return response.headers.get('Content-Type').indexOf(this.contentType[1]) >= 0;
  // }

  // async optimize(url, response) {
  //   let body = await response.text();

  //   body = body.replace('<head>', `
  //     <head>
  //       <script data-state="apollo" data-gwd-opt="none">
  //         window.__APOLLO_STATE__ = true;
  //       </script>
  //   `);

  //   return new Response(body);
  // }
}

const greenwoodPluginContentAsData = {
  type: 'resource',
  name: 'plugin-content-as-data:resource',
  provider: (compilation) => new ContentAsDataResource(compilation)
};

export { greenwoodPluginContentAsData };