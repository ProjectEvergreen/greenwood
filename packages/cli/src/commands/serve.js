import { getStaticServer, getHybridServer } from '../lifecycles/serve.js';

const runProdServer = async (compilation) => {

  return new Promise(async (resolve, reject) => {

    try {
      const port = compilation.config.port;
      const hasDynamicRoutes = compilation.graph.filter(page => page.isSSR && ((page.data.hasOwnProperty('static') && !page.data.static) || !compilation.config.prerender));
      const server = hasDynamicRoutes.length > 0 ? getHybridServer : getStaticServer;

      (await server(compilation)).listen(port, () => {
        console.info(`Started server at localhost:${port}`);
      });
    } catch (err) {
      reject(err);
    }

  });
};

export { runProdServer };