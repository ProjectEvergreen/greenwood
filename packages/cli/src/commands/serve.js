const generateCompilation = require('../lifecycles/compile');
const { prodServer } = require('../lifecycles/serve');

module.exports = runProdServer = async () => {

  return new Promise(async (resolve, reject) => {

    try {
      const compilation = await generateCompilation();
      const port = 8080;
      
      prodServer(compilation).listen(port, () => {
        console.info(`Started production test server at localhost:${port}`);
      });
    } catch (err) {
      reject(err);
    }

  });
};