import fs from 'fs';
import { generateCompilation } from '../lifecycles/compile.js';
import path from 'path';

const ejectConfiguration = async () => {
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

export { ejectConfiguration };