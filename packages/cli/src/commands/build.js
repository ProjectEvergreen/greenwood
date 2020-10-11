const fs = require('fs');
const bundleCompilation = require('../lifecycles/bundle');
const copyAssets = require('../lifecycles/copy');
const generateCompilation = require('../lifecycles/compile');
const serializeCompilation = require('../lifecycles/serialize');
const { devServer } = require('../lifecycles/serve');

module.exports = runProductionBuild = async () => {

  return new Promise(async (resolve, reject) => {

    try {
      const compilation = await generateCompilation();
      const port = compilation.config.devServer.port;
      const outputDir = compilation.context.outputDir;

      devServer(compilation).listen(port);
  
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
      }
  
      await serializeCompilation(compilation);
      await bundleCompilation(compilation);
      await copyAssets(compilation);

      resolve();
    } catch (err) {
      reject(err);
    }
  });
  
};