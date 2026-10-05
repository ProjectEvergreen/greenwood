import http from "node:http";
import { getDevServer } from "@greenwood/cli/src/lifecycles/serve.js";
import { listenOnAvailablePort } from "@greenwood/cli/src/lib/server-utils.js";

const serverState = {
  port: null,
};

class PuppeteerServer {
  constructor(compilation) {
    this.compilation = compilation;
  }

  // only need this running for production builds when prerendering
  async start() {
    if (process.env.__GWD_COMMAND__ === "build") {
      const preferredPort = this.compilation.config.devServer.port + 1;
      const app = await getDevServer(this.compilation);
      const server = http.createServer(app.callback());
      const port = await listenOnAvailablePort(server, preferredPort);

      serverState.port = port;

      if (port !== preferredPort) {
        console.warn(
          `Puppeteer prerender port ${preferredPort} is already in use, using next available port of ${port} instead.`,
        );
      }

      console.info(`Started puppeteer prerender server at http://localhost:${port}`);
    } else {
      await Promise.resolve();
    }
  }
}

export { PuppeteerServer, serverState };
