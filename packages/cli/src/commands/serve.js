import { getStaticServer, getHybridServer } from "../lifecycles/serve.js";
import { checkResourceExists } from "../lib/resource-utils.js";

const runProdServer = async (compilation) => {
  const { basePath, port } = compilation.config;
  const postfixSlash = basePath === "" ? "" : "/";
  const hasApisDir = await checkResourceExists(compilation.context.apisDir);
  // const hasDynamicRoutes = compilation.graph.find((page) => page.isSSR && !page.prerender && !page.staticPaths);
  // const hasDynamicRoutes = compilation.graph.find(

  //   (page) => page.isSSR && !page.staticPaths && (page.prerender !== true || (!compilation.config.prerender && page.prerender !== false))
  // );
  const hasDynamicRoutes = compilation.graph.find((page) => {
    let is = page.isSSR && !page.staticPaths && page.prerender !== true;

    if (is && compilation.config.prerender && page.prerender !== false) {
      is = false;
    }

    return is;
  });
  console.log("*****", { hasDynamicRoutes, hasApisDir, prerender: compilation.config.prerender });
  const server = hasDynamicRoutes || hasApisDir ? getHybridServer : getStaticServer;

  (await server(compilation)).listen(port, () => {
    console.info(`Started server at http://localhost:${port}${basePath}${postfixSlash}`);
  });

  // we intentionally _don't_ want this promise to resolve to keep the server "hanging" for production
  return new Promise(() => {});
};

export { runProdServer };
