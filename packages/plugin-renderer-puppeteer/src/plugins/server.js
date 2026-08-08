import { getDevServer } from "@greenwood/cli/src/lifecycles/serve.js";

class PuppeteerServer {
  constructor(compilation, options = {}) {
    this.compilation = compilation;
    this.options = options;
  }

  // only need this running for production builds when prerendering
  async start() {
    if (process.env.__GWD_COMMAND__ === "build") {
      const { port } = this.compilation.config.devServer;
      const offsetPort = port + 1; // don't try and start the dev server on the same port as the CLI
      const app = await getDevServer(this.compilation);

      await new Promise((resolve, reject) => {
        const onError = (error) => reject(error);
        const server = app.listen(offsetPort, () => {
          server.off("error", onError);
          console.info(`Started puppeteer prerender server at http://localhost:${offsetPort}`);
          resolve();
        });

        server.once("error", onError);
      });
    } else {
      await Promise.resolve();
    }
  }
}

export { PuppeteerServer };
