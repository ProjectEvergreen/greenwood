const LocalWebServer = require('local-web-server');
const path = require('path');
const browserRunner = require('./util/browser');

const localWebServer = new LocalWebServer();
const PORT = '8000'; 

const runBrowser = async (config, compilation) => {
  console.log('compilation', compilation);
  // const cache = require(path.join(process.cwd(), './cache.json'));

  try {
    return await Promise.all(compilation.graph.map(file => {
      console.log('file', file);
      const path = file.path === '/' ? '' : file.path; 
      
      return browserRunner(`http://127.0.0.1:${PORT}/${path}`, file.label);
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

      const server = localWebServer.listen({
        port: PORT,
        https: false,
        directory: path.join(process.cwd(), './public'),
        spa: path.join(process.cwd(), './public', './index.html')
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