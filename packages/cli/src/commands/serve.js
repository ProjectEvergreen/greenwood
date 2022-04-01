import { getStaticServer, getHybridServer } from '../lifecycles/serve.js';

const runProdServer = async (compilation) => {

  return new Promise(async (resolve, reject) => {

    try {
      const port = compilation.config.port;
      const hasRoutes = compilation.graph.find(page => page.isSSR);
      const server = hasRoutes ? getHybridServer : getStaticServer;

      (await server(compilation)).listen(port, () => {
        console.info(`Started server at localhost:${port}`);
      });
    } catch (err) {
      reject(err);
    }

  });
};

export { runProdServer };