import fs from 'fs';

const initContext = async({ config }) => {

  return new Promise(async (resolve, reject) => {
    try {
      const { workspace, pagesDirectory, templatesDirectory } = config;

      const projectDirectory = new URL(`file://${process.cwd()}/`);
      const scratchDir = new URL('./.greenwood/', projectDirectory);
      const outputDir = new URL('./public/', projectDirectory);
      const dataDir = new URL('../data/', import.meta.url);
      const userWorkspace = workspace;
      const apisDir = new URL('./apis/', userWorkspace);
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

      if (!fs.existsSync(scratchDir.pathname)) {
        fs.mkdirSync(scratchDir.pathname, {
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