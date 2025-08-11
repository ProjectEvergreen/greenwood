import { asyncMap } from "../../cli/src/lib/async-utils.js";

export default async function (compilation, callback) {
  const BrowserRunner = (await import("./lib/browser.js")).BrowserRunner;
  const browserRunner = new BrowserRunner();

  const runBrowser = async (serverUrl, pages) => {
    try {
      return asyncMap(pages, async (page) => {
        const { route } = page;
        console.info("prerendering page...", route);

        return await browserRunner.serialize(`${serverUrl}${route}`).then(async (html) => {
          console.info(`prerendering complete for page ${route}.`);

          // clean this up here to avoid sending webcomponents-bundle to rollup
          html = html.replace(/<script src="(.*webcomponents-bundle.js)"><\/script>/, "");

          await callback(page, html);
        });
      });
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  // gracefully handle if puppeteer is not installed correctly
  // like may happen in a stackblitz environment and just reject early
  // otherwise we can feel confident attempting to prerender all pages
  // https://github.com/ProjectEvergreen/greenwood/discussions/639
  try {
    await browserRunner.init();
  } catch (e) {
    console.error(e);

    console.error("*******************************************************************");
    console.error("*******************************************************************");

    console.error("There was an error trying to initialize puppeteer for pre-rendering.");

    console.info(
      "To troubleshoot, please check your environment for any npm install or postinstall errors, as may be the case in a Stackblitz or other sandbox like environment.",
    );
    console.info(
      "For more information please see this guide - https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md",
    );

    return Promise.reject();
  }

  const pages = compilation.graph.filter((page) => !page.isSSR);
  const port = compilation.config.devServer.port;
  const offsetPort = port + 1; // don't try and start the dev server on the same port as the CLI
  const serverAddress = `http://127.0.0.1:${offsetPort}`;

  await runBrowser(serverAddress, pages);
  browserRunner.close();
}
