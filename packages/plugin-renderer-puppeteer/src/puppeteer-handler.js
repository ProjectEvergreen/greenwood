export default async function(compilation, callback) {
  const BrowserRunner = (await import('./lib/browser.js')).BrowserRunner;
  const browserRunner = new BrowserRunner();

  const runBrowser = async (serverUrl, pages) => {
    try {
      return Promise.all(pages.map(async(page) => {
        const { route } = page;
        console.info('prerendering page...', route);
        
        return await browserRunner
          .serialize(`${serverUrl}${route}`)
          .then(async (contents) => {
            console.info(`prerendering complete for page ${route}.`);
            
            await callback(page, contents);
          });
      }));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(err);
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

    console.error('*******************************************************************');
    console.error('*******************************************************************');

    console.error('There was an error trying to initialize puppeteer for pre-rendering.');

    console.info('To troubleshoot, please check your environment for any npm install or postinstall errors, as may be the case in a Stackblitz or other sandbox like environment.');
    console.info('For more information please see this guide - https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md');

    return Promise.reject();
  }

  return new Promise(async (resolve, reject) => {
    try {
      const pages = compilation.graph.filter(page => !page.isSSR);
      const port = compilation.config.devServer.port;
      const serverAddress = `http://127.0.0.1:${port}`;

      await runBrowser(serverAddress, pages);
      browserRunner.close();

      resolve();
    } catch (err) {
      reject(err);
    }
  });
}