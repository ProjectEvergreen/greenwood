import { ServerInterface } from '@greenwood/cli/src/lib/server-interface.js';
import { getDevServer } from '@greenwood/cli/src/lifecycles/serve.js';

class PuppeteerServer extends ServerInterface {
  constructor(compilation, options = {}) {
    super(compilation, options);
  }

  // only need this running for production builds when prerendering
  async start() {
    if (process.env.__GWD_COMMAND__ === 'build') { // eslint-disable-line no-underscore-dangle
      const { port } = this.compilation.config.devServer;
      const offsetPort = port + 1; // don't try and start the dev server on the same port as the CLI

      (await getDevServer(this.compilation)).listen(offsetPort, async () => {
        console.info(`Started puppeteer prerender server at http://localhost:${offsetPort}`);
      });
    } else {
      await Promise.resolve();
    }
  }
}

export { PuppeteerServer };