const { execSync } = require('child_process');
const fs = require('fs');
const generateCompilation = require('../lifecycles/compile');
const serializeBuild = require('../lifecycles/serialize');
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
  
      await serializeBuild(compilation);

      // TODO this is a hack just for the sake of the POC, will do for real :)
      // rollup.write(rollupConfig);
      execSync('rollup -c ./packages/cli/src/config/rollup.config.js');

      // TODO part of rollup?
      execSync(`cp -vr ${compilation.context.userWorkspace}/assets/ ./public/assets`);

      // TODO should be done by rollup
      execSync(`cp -vr ${compilation.context.userWorkspace}/styles/ ./public/styles`);

      // TODO should be done by rollup
      execSync(`cp -vr ${compilation.context.scratchDir}/graph.json ./public`);
  
      resolve();
    } catch (err) {
      reject(err);
    }
  });
  
};