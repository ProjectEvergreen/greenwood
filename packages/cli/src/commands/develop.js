import http from "node:http";
import { getDevServer } from "../lifecycles/serve.js";
import { listenOnAvailablePort } from "../lib/server-utils.js";

const runDevServer = async (compilation) => {
  const { basePath, devServer } = compilation.config;
  const preferredPort = devServer.port;
  const app = await getDevServer(compilation);
  const server = http.createServer(app.callback());
  const port = await listenOnAvailablePort(server, preferredPort);

  // update devServer.port configuration to the actual port that was available
  devServer.port = port;

  if (port !== preferredPort) {
    console.warn(
      `Port ${preferredPort} is already in use, using next available port of ${port} instead.`,
    );
  }

  const servers = [
    ...compilation.config.plugins
      .filter((plugin) => {
        return plugin.type === "server";
      })
      .map((plugin) => plugin.provider(compilation)),
  ];

  await Promise.all(servers.map((server) => server.start()));

  console.info(`Started local development server at http://localhost:${port}${basePath}`);

  // we intentionally _don't_ want this promise to resolve to keep the servers "hanging" for development
  return new Promise(() => {});
};

export { runDevServer };
