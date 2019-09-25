const LocalWebServer = require('local-web-server');
const browserRunner = require('../lib/browser');
const fs = require('fs');
const localWebServer = new LocalWebServer();
const path = require('path');
const PORT = '8000';
// puppeteer specific polyfills - #193
const polyfillPath = path.join(process.cwd(), 'node_modules/@webcomponents/webcomponentsjs/webcomponents-bundle.js');
const polyfill = fs.readFileSync(polyfillPath, 'utf8');
      
const runBrowser = async (compilation) => {

  try {
    return await Promise.all(compilation.graph.map(({ route, label }) => {
      const { publicDir } = compilation.context;

      return browserRunner(`http://127.0.0.1:${PORT}${route}`, label, route, publicDir).then((content) => {
        const target = path.join(publicDir, route);       
        const html = content
          .replace(polyfill, '')
          .replace('<script></script>', '');
 
        fs.mkdirSync(target, { recursive: true });
        fs.writeFileSync(path.join(target, 'index.html'), html);
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

      resolve();
    } catch (err) {
      reject(err);
    }

  });
};