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

      (await getDevServer(this.compilation)).listen(port, async () => {
        console.info(`Started puppeteer prerender server at localhost:${port}`);
      });
    } else {
      await Promise.resolve();
    }
  }
}

export { PuppeteerServer };