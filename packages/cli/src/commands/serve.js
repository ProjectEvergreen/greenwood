import { prodServer } from '../lifecycles/serve.js';

const runProdServer = async (compilation) => {

  return new Promise(async (resolve, reject) => {

    try {
      const port = 8080;
      
      (await prodServer(compilation)).listen(port, () => {
        console.info(`Started production test server at localhost:${port}`);
      });
    } catch (err) {
      reject(err);
    }

  });
};

export { runProdServer };