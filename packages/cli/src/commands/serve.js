import { generateCompilation } from '../lifecycles/compile.js';
import { prodServer } from '../lifecycles/serve.js';

const runProdServer = async () => {

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

export { runProdServer };