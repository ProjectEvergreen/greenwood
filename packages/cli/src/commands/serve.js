import { generateCompilation } from '../lifecycles/compile.js';
import { getStaticServer, getHybridServer } from '../lifecycles/serve.js';

const runProdServer = async () => {

  return new Promise(async (resolve, reject) => {

    try {
      const compilation = await generateCompilation();
      const port = 8080;
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