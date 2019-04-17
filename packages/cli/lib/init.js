const fs = require('fs');
const path = require('path');
const defaultTemplatesDir = path.join(__dirname, '../templates');
const scratchDir = path.join(process.cwd(), './.greenwood/');
const publicDir = path.join(process.cwd(), './public');

module.exports = initDirectories = async() => {

  return new Promise((resolve, reject) => {
    try {

      const usrWorkspace = path.join(process.cwd(), 'src');
      const usrPagesDir = path.join(usrWorkspace, 'pages');
      const usrTemplatesDir = path.join(usrWorkspace, 'templates');
      const usrAppTemplate = path.join(usrTemplatesDir, 'app-template.js');
      const usrPageTemplate = path.join(usrTemplatesDir, 'page-template.js');

      const userHasWorkspace = fs.existsSync(usrWorkspace);
      const userHasWorkspacePages = fs.existsSync(usrPagesDir);
      const userHasWorkspaceTemplates = fs.existsSync(usrTemplatesDir);
      const userHasWorkspacePageTemplate = fs.existsSync(usrPageTemplate);
      const userHasWorkspaceAppTemplate = fs.existsSync(usrAppTemplate);

      let config = {
        scratchDir,
        publicDir,
        pagesDir: userHasWorkspacePages ? usrPagesDir : defaultTemplatesDir,
        templatesDir: userHasWorkspaceTemplates ? usrTemplatesDir : defaultTemplatesDir,
        rootContext: userHasWorkspace ? usrWorkspace : defaultTemplatesDir,
        pageTemplatePath: userHasWorkspacePageTemplate 
          ? usrPageTemplate 
          : path.join(defaultTemplatesDir, 'page-template.js'),
        appTemplatePath: userHasWorkspaceAppTemplate 
          ? usrAppTemplate 
          : path.join(defaultTemplatesDir, 'app-template.js')
      };

      if (!fs.existsSync(scratchDir)) {
        fs.mkdirSync(scratchDir);
      }
      resolve(config);
    } catch (err) {
      reject(err);
    }
  });
};