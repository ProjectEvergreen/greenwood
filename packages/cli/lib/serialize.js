const LocalWebServer = require('local-web-server');
const browserRunner = require('./util/browser');
const localWebServer = new LocalWebServer();
const PORT = '8000'; 

const runBrowser = async (compilation) => {

  try {
    return await Promise.all(compilation.graph.map(file => {
      const route = file.route === '/' ? '' : file.route;
      
      return browserRunner(`http://127.0.0.1:${PORT}/${route}`, file.label, file.route, compilation.context.publicDir);
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
        spa: 'index.html' // TODO magic string
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