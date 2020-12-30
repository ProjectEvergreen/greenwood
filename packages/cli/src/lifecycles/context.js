const fs = require('fs');
const path = require('path');
const scratchDir = path.join(process.cwd(), './.greenwood/');
const outputDir = path.join(process.cwd(), './public');
const dataDir = path.join(__dirname, '../data');

module.exports = initContexts = async({ config }) => {

  return new Promise(async (resolve, reject) => {

    try {
      const projectDirectory = process.cwd();
      const userWorkspace = path.join(config.workspace);
      const pagesDir = path.join(userWorkspace, 'pages/');
      const userTemplatesDir = path.join(userWorkspace, 'templates/');

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