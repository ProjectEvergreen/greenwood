import { getDevServer } from "../lifecycles/serve.js";

const runDevServer = async (compilation) => {
  const { basePath, devServer } = compilation.config;
  const { port } = devServer;
  const postfixSlash = basePath === "" ? "" : "/";

  // we intentionally _don't_ want this promise to resolve to keep the servers "hanging" for development
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    try {
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
    } catch (err) {
      reject(err);
    }
  });
};

export { runDevServer };
