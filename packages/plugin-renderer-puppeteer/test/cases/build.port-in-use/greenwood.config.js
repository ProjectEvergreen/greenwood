import net from "node:net";
import { greenwoodPluginRendererPuppeteer } from "../../../src/index.js";

// Active content can change devServer.port before server plugins start. Occupy the
// renderer's actual preferred port so this fixture always exercises its fallback.
const plugins = greenwoodPluginRendererPuppeteer().map((plugin) => {
  if (plugin.type !== "server") {
    return plugin;
  }

  return {
    ...plugin,
    provider(compilation) {
      const server = plugin.provider(compilation);

      return {
        async start() {
          const port = compilation.config.devServer.port + 1;
          const blocker = net.createServer();

          await new Promise((resolve, reject) => {
            blocker.once("error", reject);
            blocker.listen(port, resolve);
          }).catch((error) => {
            if (error.code !== "EADDRINUSE") {
              throw error;
            }
          });

          console.info(`Puppeteer preferred port: ${port}`);

          try {
            await server.start();
          } finally {
            if (blocker.listening) {
              await new Promise((resolve) => blocker.close(resolve));
            }
          }
        },
      };
    },
  };
});

export default {
  activeContent: true,
  prerender: true,
  concurrency: 2,
  devServer: {
    port: 1990,
  },
  plugins,
};
