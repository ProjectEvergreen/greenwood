import fs from 'fs/promises';
import { checkResourceExists } from '../lib/resource-utils.js';

const initContext = async({ config }) => {

  return new Promise(async (resolve, reject) => {
    try {
      const { workspace, pagesDirectory, templatesDirectory } = config;

      const projectDirectory = new URL(`file://${process.cwd()}/`);
      const scratchDir = new URL('./.greenwood/', projectDirectory);
      const outputDir = new URL('./public/', projectDirectory);
      const dataDir = new URL('../data/', import.meta.url);
      const templatesDir = new URL('../templates/', import.meta.url);
      const userWorkspace = workspace;
      const apisDir = new URL('./api/', userWorkspace);
      const pagesDir = new URL(`./${pagesDirectory}/`, userWorkspace);
      const userTemplatesDir = new URL(`./${templatesDirectory}/`, userWorkspace);

      const context = {
        dataDir,
        outputDir,
        userWorkspace,
        apisDir,
        pagesDir,
        userTemplatesDir,
        scratchDir,
        projectDirectory,
        templatesDir
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