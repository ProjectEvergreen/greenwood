import { mergeImportMap } from '../../lib/walker-package-ranger.js';
import { ResourceInterface } from '../../lib/resource-interface.js';

const importMap = {
  '@greenwood/cli/src/data/queries.js': '/node_modules/@greenwood/cli/src/data/queries.js'
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
    const body = await response.text();
    const newBody = mergeImportMap(body, importMap);

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