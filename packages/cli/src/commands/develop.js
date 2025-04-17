import { getDevServer } from "../lifecycles/serve.js";

const runDevServer = async (compilation) => {
  const { basePath, devServer } = compilation.config;
  const { port } = devServer;
  const postfixSlash = basePath === "" ? "" : "/";

  (await getDevServer(compilation)).listen(port, async () => {
    console.info(
      `Started local development server at http://localhost:${port}${basePath}${postfixSlash}`,
    );

    const servers = [
      ...compilation.config.plugins
        .filter((plugin) => {
          return plugin.type === "server";
        })
        .map((plugin) => plugin.provider(compilation)),
    ];

    for (const server of servers) {
      server.start();
    }
  });

  // we intentionally _don't_ want this promise to resolve to keep the servers "hanging" for development
  return new Promise(() => {});
};

export { runDevServer };
