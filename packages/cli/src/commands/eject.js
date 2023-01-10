import fs from 'fs';

const ejectConfiguration = async (compilation) => {
  return new Promise(async (resolve, reject) => {
    try {
      const configFileDirUrl = new URL('../config/', import.meta.url);
      const configFiles = await fs.promises.readdir(configFileDirUrl);
      
      configFiles.forEach((configFile) => {
        const from = new URL(`./${configFile}`, configFileDirUrl);
        const to = new URL(`./${configFile}`, compilation.context.projectDirectory);

        fs.copyFileSync(from.pathname, to.pathname);
        
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