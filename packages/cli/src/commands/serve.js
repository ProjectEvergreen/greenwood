import { getStaticServer, getHybridServer } from '../lifecycles/serve.js';
import { checkResourceExists } from '../lib/resource-utils.js';

const runProdServer = async (compilation) => {

  return new Promise(async (resolve, reject) => {

    try {
      const port = compilation.config.port;
      const hasApisDir = await checkResourceExists(compilation.context.apisDir);
      const hasDynamicRoutes = compilation.graph.find(page => page.isSSR && !page.data.static);
      const server = (hasDynamicRoutes && !compilation.config.prerender) || hasApisDir ? getHybridServer : getStaticServer;

      (await server(compilation)).listen(port, () => {
        console.info(`Started server at localhost:${port}`);
      });
    } catch (err) {
      reject(err);
    }

  });
};

export { runProdServer };