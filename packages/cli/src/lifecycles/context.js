import fs from 'fs/promises';

const initContext = async({ config }) => {

  return new Promise(async (resolve, reject) => {
    try {
      const { workspace, pagesDirectory, templatesDirectory } = config;

      const projectDirectory = new URL(`file://${process.cwd()}/`);
      const scratchDir = new URL('./.greenwood/', projectDirectory);
      const outputDir = new URL('./public/', projectDirectory);
      const dataDir = new URL('../data/', import.meta.url);
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
        projectDirectory
      };

      try {
        await fs.access(scratchDir);
      } catch(e) {
        await fs.mkdir(scratchDir, {
          recursive: true
        })
      }
      
      resolve(context);
    } catch (err) {
      console.log(err);
      reject(err);
    }
  });
};

export { initContext };