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

      (await getDevServer(this.compilation)).listen(offsetPort, async () => {
        console.info(`Started puppeteer prerender server at http://localhost:${offsetPort}`);
      });
    }
  }
}

export { PuppeteerServer };
