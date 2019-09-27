const fs = require('fs');
const LocalWebServer = require('local-web-server');
const path = require('path');
const puppeteer = require('puppeteer');
const { Renderer } = require('../lib/renderer');

// puppeteer specific polyfills - #193
const polyfillPath = path.join(process.cwd(), 'node_modules/@webcomponents/webcomponentsjs/webcomponents-bundle.js');
const polyfill = fs.readFileSync(polyfillPath, 'utf8');
const PORT = '8000';

const runBrowser = async (compilation) => {

  try {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox']
    });

    const renderer = new Renderer(browser);

    await Promise.all(compilation.graph.map(async ({ route }) => {
      const { publicDir } = compilation.context;

      return await renderer.serializePage(`http://127.0.0.1:${PORT}${route}`).then((content) => {
        const target = path.join(publicDir, route);       
        
        const html = content
          .replace(polyfill, '')
          .replace('<script></script>', '');
 
        fs.mkdirSync(target, { recursive: true });
        fs.writeFileSync(path.join(target, 'index.html'), html);
      });
    }));

    browser.close();
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
      const localWebServer = new LocalWebServer();
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