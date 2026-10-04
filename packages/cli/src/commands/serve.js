import http from "node:http";
import { getStaticServer, getHybridServer } from "../lifecycles/serve.js";
import { checkResourceExists } from "../lib/resource-utils.js";
import { getDynamicPages } from "../lib/graph-utils.js";
import { listenOnAvailablePort } from "../lib/server-utils.js";

const runProdServer = async (compilation) => {
  const { basePath, port: preferredPort } = compilation.config;
  const hasApisDir = await checkResourceExists(compilation.context.apisDir);
  const hasDynamicRoutes = getDynamicPages(compilation).length > 0;
  const server = hasDynamicRoutes || hasApisDir ? getHybridServer : getStaticServer;

  const app = await server(compilation);
  const httpServer = http.createServer(app.callback());
  const port = await listenOnAvailablePort(httpServer, preferredPort);

  compilation.config.port = port;

  if (port !== preferredPort) {
    console.warn(
      `Port ${preferredPort} is already in use, using next available port of ${port} instead.`,
    );
  }

  console.info(`Started server at http://localhost:${port}${basePath}`);

  // we intentionally _don't_ want this promise to resolve to keep the server "hanging" for production
  return new Promise(() => {});
};

export { runProdServer };
