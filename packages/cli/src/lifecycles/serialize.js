const LocalWebServer = require('local-web-server');
const browserRunner = require('../lib/browser');
const fs = require('fs-extra');
const localWebServer = new LocalWebServer();
const path = require('path');
const PORT = '8000';

const runBrowser = async (compilation) => {

  try {
    return Promise.all(compilation.graph.map(({ route, label }) => {
      const { publicDir } = compilation.context;

      return browserRunner(`http://127.0.0.1:${PORT}${route}`, label, route, publicDir).then(async (content) => {
        const target = path.join(publicDir, route);

        await fs.mkdirs(target, { recursive: true });
        await fs.writeFile(path.join(target, 'index.html'), content);

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