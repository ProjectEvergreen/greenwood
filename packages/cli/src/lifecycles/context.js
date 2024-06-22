import fs from 'fs/promises';
import { checkResourceExists } from '../lib/resource-utils.js';

const initContext = async({ config }) => {

  return new Promise(async (resolve, reject) => {
    try {
      const { workspace, pagesDirectory, layoutsDirectory } = config;

      const projectDirectory = new URL(`file://${process.cwd()}/`);
      const scratchDir = new URL('./.greenwood/', projectDirectory);
      const outputDir = new URL('./public/', projectDirectory);
      const dataDir = new URL('../data/', import.meta.url);
      const layoutsDir = new URL('../layouts/', import.meta.url);
      const userWorkspace = workspace;
      const pagesDir = new URL(`./${pagesDirectory}/`, userWorkspace);
      const apisDir = new URL('./api/', pagesDir);
      const userLayoutsDir = new URL(`./${layoutsDirectory}/`, userWorkspace);

      const context = {
        dataDir,
        outputDir,
        userWorkspace,
        apisDir,
        pagesDir,
        userLayoutsDir,
        scratchDir,
        projectDirectory,
        layoutsDir
      };

      if (!await checkResourceExists(scratchDir)) {
        await fs.mkdir(scratchDir, {
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