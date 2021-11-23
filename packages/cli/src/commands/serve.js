const generateCompilation = require('../lifecycles/compile');
const { staticServer, hybridServer } = require('../lifecycles/serve');

module.exports = runProdServer = async () => {

  return new Promise(async (resolve, reject) => {

    try {
      const compilation = await generateCompilation();
      const port = 8080;
      const server = compilation.config.mode === 'ssr' ? hybridServer : staticServer;

      server(compilation).listen(port, () => {
        console.info(`Started server at localhost:${port}`);
      });
    } catch (err) {
      reject(err);
    }

  });
};