import { getStaticServer, getHybridServer } from "../lifecycles/serve.js";
import { checkResourceExists } from "../lib/resource-utils.js";
import { getDynamicPages } from "../lib/graph-utils.js";

const runProdServer = async (compilation) => {
  const { basePath, port } = compilation.config;
  const postfixSlash = basePath === "" ? "" : "/";
  const hasApisDir = await checkResourceExists(compilation.context.apisDir);
  const hasDynamicRoutes = getDynamicPages(compilation).length > 0;
  console.log("*****", { hasDynamicRoutes, hasApisDir, prerender: compilation.config.prerender });
  const server = hasDynamicRoutes || hasApisDir ? getHybridServer : getStaticServer;

  (await server(compilation)).listen(port, () => {
    console.info(`Started server at http://localhost:${port}${basePath}${postfixSlash}`);
  });

  // we intentionally _don't_ want this promise to resolve to keep the server "hanging" for production
  return new Promise(() => {});
};

export { runProdServer };
