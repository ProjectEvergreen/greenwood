const LocalWebServer = require('local-web-server');
const path = require('path');
const browserRunner = require('./util/browser');
const { buildCompilation } = require('./build');

const localWebServer = new LocalWebServer();
const PORT = '8000'; 

const runBrowser = async (config, compilation) => {

  try {
    return await Promise.all(compilation.graph.map(file => {
      const path = file.path === '/' ? '' : file.path;
      
      return browserRunner(`http://127.0.0.1:${PORT}${path}`, file.label, config.publicDir);
    }));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    return false;
  }
};

module.exports = serializeBuild = async (config, compilation) => {
  return new Promise(async (resolve, reject) => {
    try {
      // build our SPA application first
      await buildCompilation(config, compilation);

      // "serialize" our SPA into a static site
      const server = localWebServer.listen({
        port: PORT,
        https: false,
        directory: path.join(config.publicDir),
        spa: 'index.html'
      });

      await runBrowser(config, compilation);

      server.close();
      // eslint-disable-next-line no-process-exit
      resolve();
    } catch (err) {
      reject(err);
    }

  });
};