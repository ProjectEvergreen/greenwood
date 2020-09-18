const generateCompilation = require('../lifecycles/compile');
const livereload = require('livereload');
const { server } = require('../lifecycles/serve');

module.exports = runDevServer = async () => {

  return new Promise(async (resolve, reject) => {

    try {
      const compilation = await generateCompilation();
      const { port } = compilation.config.devServer;
      const { userWorkspace } = compilation.context;
      
      server.listen(port, () => {
        console.info(`Started local development at localhost:${port}`);
        const liveReloadServer = livereload.createServer({
          exts: ['html', 'css', 'js', 'md'],
          applyCSSLive: false // https://github.com/napcs/node-livereload/issues/33#issuecomment-693707006
        });

        liveReloadServer.watch(userWorkspace, () => {
          console.info(`Now watching directory "${userWorkspace}" for changes.`);
        });
      });
    } catch (err) {
      reject(err);
    }

  });
};