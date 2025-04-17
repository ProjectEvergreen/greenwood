import { getStaticServer, getHybridServer } from "../lifecycles/serve.js";
import { checkResourceExists } from "../lib/resource-utils.js";

const runProdServer = async (compilation) => {
  const { basePath, port } = compilation.config;
  const postfixSlash = basePath === "" ? "" : "/";
  const hasApisDir = await checkResourceExists(compilation.context.apisDir);
  const hasDynamicRoutes = compilation.graph.find((page) => page.isSSR && !page.prerender);
  const server =
    (hasDynamicRoutes && !compilation.config.prerender) || hasApisDir
      ? getHybridServer
      : getStaticServer;

  // we intentionally _don't_ want this promise to resolve to keep the server "hanging" for production
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    try {
      (await server(compilation)).listen(port, () => {
        console.info(`Started server at http://localhost:${port}${basePath}${postfixSlash}`);
      });
    } catch (err) {
      reject(err);
    }
  });
};
export { runProdServer };
