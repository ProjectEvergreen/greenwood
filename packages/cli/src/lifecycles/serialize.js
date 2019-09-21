const LocalWebServer = require('local-web-server');
const browserRunner = require('../lib/browser');
const fs = require('fs');
const localWebServer = new LocalWebServer();
const path = require('path');
const PORT = '8000'; 

const runBrowser = async (compilation) => {

  try {
    return await Promise.all(compilation.graph.map(({ route, label }) => {
      return browserRunner(`http://127.0.0.1:${PORT}${route}`, label, route, compilation.context.publicDir);
    }));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    return false;
  }
};

module.exports = serializeBuild = async (compilation) => {
  return new Promise(async (resolve, reject) => {
    try {
      // puppeteer specific polyfills #193
      const polyfillPath = path.join(process.cwd(), 'node_modules/@webcomponents/webcomponentsjs/webcomponents-bundle.js');
      const polyfill = await fs.readFileSync(polyfillPath, 'utf8');
      const indexContentsPath = path.join(compilation.context.publicDir, compilation.context.indexPageTemplate);
      const indexContents = fs.readFileSync(indexContentsPath, 'utf8');
      const indexContentsPolyfilled = indexContents.replace('<body>', `<script>${polyfill}</script><body>`);

      fs.writeFileSync(indexContentsPath, indexContentsPolyfilled);

      // "serialize" our SPA into a static site
      const server = localWebServer.listen({
        port: PORT,
        https: false,
        directory: compilation.context.publicDir,
        spa: compilation.context.indexPageTemplate
      });

      await runBrowser(compilation);

      server.close();
      // eslint-disable-next-line no-process-exit
      resolve();
    } catch (err) {
      reject(err);
    }

  });
};