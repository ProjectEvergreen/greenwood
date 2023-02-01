import fs from 'fs/promises';

const ejectConfiguration = async (compilation) => {
  return new Promise(async (resolve, reject) => {
    try {
      const configFileDirUrl = new URL('../config/', import.meta.url);
      const configFiles = await fs.readdir(configFileDirUrl);
      
      for (const file of configFiles) {
        const from = new URL(`./${file}`, configFileDirUrl);
        const to = new URL(`./${file}`, compilation.context.projectDirectory);

        await fs.copyFile(from.pathname, to.pathname);
        
        console.log(`Ejected ${file} successfully.`);
      }

      console.debug('all configuration files ejected.');

      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

export { ejectConfiguration };