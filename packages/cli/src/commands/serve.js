import { getStaticServer, getHybridServer } from '../lifecycles/serve.js';
import { checkResourceExists } from '../lib/resource-utils.js';

const runProdServer = async (compilation) => {

  return new Promise(async (resolve, reject) => {

    try {
      const { basePath, port } = compilation.config;
      const postfixSlash = basePath === '' ? '' : '/';
      const hasApisDir = await checkResourceExists(compilation.context.apisDir);
      const hasDynamicRoutes = compilation.graph.find(page => page.isSSR && !page.prerender);
      const server = (hasDynamicRoutes && !compilation.config.prerender) || hasApisDir ? getHybridServer : getStaticServer;

      (await server(compilation)).listen(port, () => {
        console.info(`Started server at http://localhost:${port}${basePath}${postfixSlash}`);
      });
    } catch (err) {
      reject(err);
    }

  });
};

export { runProdServer };