const BrowserRunner = require('../lib/browser');
const dataServer = require('../data/server');
const deepmerge = require('deepmerge');
const fs = require('fs-extra');
const glob = require('glob-promise');
const LocalWebServer = require('local-web-server');
const path = require('path');

const setDataForPages = async (context) => {
  const { publicDir } = context;
  const pages = await glob.promise(path.join(publicDir, '**/**/index.html'));

  pages.forEach((pagePath) => {
    const contents = fs.readFileSync(pagePath, 'utf-8');
    // TODO hardcoded root / depth - #273
    const pageRoot = pagePath.replace(publicDir, '').split('/')[1];
    const cacheRoot = pageRoot === 'index.html'
      ? ''
      : `${pageRoot}`;
    let cacheContents = {};
    
    // TODO avoid having to do this per page / root, each time - #277
    glob.sync(`${publicDir}/${cacheRoot}/*-cache.json`).forEach((file) => {
      cacheContents = deepmerge(cacheContents, require(file));
    });

    const serialzedCacheContents = JSON.stringify(cacheContents);

    // TODO could optimize this probably - #277
    fs.writeFileSync(`${publicDir}/${cacheRoot}/cache.json`, serialzedCacheContents);
    fs.writeFileSync(pagePath, contents.replace('___DATA___', serialzedCacheContents));
  });
};

module.exports = serializeBuild = async (compilation) => {
  const browserRunner = new BrowserRunner();
  const localWebServer = new LocalWebServer();
  const PORT = '8000';
  const polyfillPath = path.join(process.cwd(), 'node_modules/@webcomponents/webcomponentsjs/webcomponents-bundle.js');
  let polyfill = '';
  
  await browserRunner.init();

  const runBrowser = async (compilation) => {
    try {
      return Promise.all(compilation.graph.map(async(page) => {
        const { publicDir } = compilation.context;
        const { route } = page;
  
        return await browserRunner.serialize(`http://127.0.0.1:${PORT}${route}`).then(async (content) => {
          const target = path.join(publicDir, route);
          const html = content
            .replace(polyfill, '')
            .replace('<script></script>', `
              <script data-state="apollo">
                window.__APOLLO_STATE__=___DATA___;
              </script> 
            `);
  
          await fs.mkdirs(target, { recursive: true });
          await fs.writeFile(path.join(target, 'index.html'), html);
        });
      }));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      return false;
    }
  };
  
  return new Promise(async (resolve, reject) => {
    try {
      polyfill = await fs.readFile(polyfillPath, 'utf8');

      const { context } = compilation;
      const indexContentsPath = path.join(compilation.context.publicDir, compilation.context.indexPageTemplate);
      const indexContents = await fs.readFile(indexContentsPath, 'utf8');
      const indexContentsPolyfilled = indexContents.replace('<body>', `<script>${polyfill}</script><body>`);

      await fs.writeFile(indexContentsPath, indexContentsPolyfilled);

      await dataServer(compilation).listen().then((server) => {
        console.log(`dataServer started at ${server.url}`);
      });

      // "serialize" our SPA into a static site
      const webServer = localWebServer.listen({
        port: PORT,
        https: false,
        directory: context.publicDir,
        spa: context.indexPageTemplate
      });

      await runBrowser(compilation);

      browserRunner.close();
      webServer.close();

      // loop through all index.html files and inject cache
      await setDataForPages(compilation.context);

      resolve();
    } catch (err) {
      reject(err);
    }

  });
};