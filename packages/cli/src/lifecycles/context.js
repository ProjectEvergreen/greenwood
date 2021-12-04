import fs from 'fs';
import path from 'path';
import { fileURLToPath, URL } from 'url';

const initContext = async({ config }) => {
  const scratchDir = path.join(process.cwd(), './.greenwood/');
  const outputDir = path.join(process.cwd(), './public');
  const dataDir = fileURLToPath(new URL('../data', import.meta.url));

  return new Promise(async (resolve, reject) => {
    try {
      const projectDirectory = process.cwd();
      const userWorkspace = path.join(config.workspace);
      const pagesDir = path.join(userWorkspace, `${config.pagesDirectory}/`);
      const userTemplatesDir = path.join(userWorkspace, `${config.templatesDirectory}/`);

      const context = {
        dataDir,
        outputDir,
        userWorkspace,
        pagesDir,
        userTemplatesDir,
        scratchDir,
        projectDirectory
      };

      if (!fs.existsSync(scratchDir)) {
        fs.mkdirSync(scratchDir, {
          recursive: true
        });
      }
      
      resolve(context);
    } catch (err) {
      console.log(err);
      reject(err);
    }
  });
};

export { initContext };