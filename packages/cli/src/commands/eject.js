import fs from 'fs';
import { generateCompilation } from '../lifecycles/compile.js';
import path from 'path';
import { URL } from 'url';

const ejectConfiguration = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      const compilation = await generateCompilation();
      const configFilePath = new URL(path.join(path.dirname(import.meta.url), '..', 'config'));
      const configFiles = fs.readdirSync(configFilePath);
      
      configFiles.forEach((configFile) => {
        const from = path.join(configFilePath.pathname, configFile);
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