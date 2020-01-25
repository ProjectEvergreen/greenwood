const LocalWebServer = require('local-web-server');
const BrowserRunner = require('../lib/browser');
const fs = require('fs-extra');
const localWebServer = new LocalWebServer();
const path = require('path');
const PORT = '8000';
const polyfillPath = path.join(process.cwd(), 'node_modules/@webcomponents/webcomponentsjs/webcomponents-bundle.js');
let polyfill = '';

browserRunner = new BrowserRunner();
browserRunner.init();

const runBrowser = async (compilation) => {
  try {
    return Promise.all(compilation.graph.map(async({ route }) => {
      const { publicDir } = compilation.context;

      return await browserRunner.serialize(`http://127.0.0.1:${PORT}${route}`).then(async (content) => {
        const target = path.join(publicDir, route);
        const html = content
          .replace(polyfill, '')
          .replace('<script></script>', '');

        await fs.mkdirs(target, { recursive: true });
        await fs.writeFile(path.join(target, 'index.html'), html);
      });
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
      polyfill = await fs.readFile(polyfillPath, 'utf8');

      const indexContentsPath = path.join(compilation.context.publicDir, compilation.context.indexPageTemplate);
      const indexContents = await fs.readFile(indexContentsPath, 'utf8');
      const indexContentsPolyfilled = indexContents.replace('<body>', `<script>${polyfill}</script><body>`);

      await fs.writeFile(indexContentsPath, indexContentsPolyfilled);

      // "serialize" our SPA into a static site
      const server = localWebServer.listen({
        port: PORT,
        https: false,
        directory: compilation.context.publicDir,
        spa: compilation.context.indexPageTemplate
      });

      await runBrowser(compilation);

      browserRunner.close();
      server.close();

      resolve();
    } catch (err) {
      reject(err);
    }

  });
};