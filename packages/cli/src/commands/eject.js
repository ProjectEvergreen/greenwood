const fs = require('fs');
const generateCompilation = require('../lifecycles/compile');
const path = require('path');

module.exports = ejectConfiguration = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      const compilation = await generateCompilation();
      const configFilePaths = fs.readdirSync(path.join(__dirname, '../config'));

      configFilePaths.forEach((configFile) => {
        const from = path.join(__dirname, '../config', configFile);
        const to = `${compilation.context.projectDirectory}/${configFile}`;

        fs.copyFileSync(from, to);
        
        console.log(`Ejected ${configFile} successfully.`);
      });

      console.debug('all configuration files ejected.');

      resolve();
    } catch (err) {
      reject(err);
    }
  });
};