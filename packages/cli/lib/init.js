const fs = require('fs');
const path = require('path');
const defaultTemplatesDir = path.join(__dirname, '../templates/');
const scratchDir = path.join(process.cwd(), './.greenwood/');
const publicDir = path.join(process.cwd(), './public');
const graph = path.join(scratchDir, 'graph.json');

module.exports = initContexts = async() => {
  
  return new Promise((resolve, reject) => {
    
    try {
      // TODO: replace user workspace src path based on config see issue #40
      // https://github.com/ProjectEvergreen/greenwood/issues/40
      const userWorkspace = path.join(process.cwd(), 'src');
      const userPagesDir = path.join(userWorkspace, 'pages/');
      const userTemplatesDir = path.join(userWorkspace, 'templates/');
      const userAppTemplate = path.join(userTemplatesDir, 'app-template.js');
      const userPageTemplate = path.join(userTemplatesDir, 'page-template.js');

      const userHasWorkspace = fs.existsSync(userWorkspace);
      const userHasWorkspacePages = fs.existsSync(userPagesDir);
      const userHasWorkspaceTemplates = fs.existsSync(userTemplatesDir);
      const userHasWorkspacePageTemplate = fs.existsSync(userPageTemplate);
      const userHasWorkspaceAppTemplate = fs.existsSync(userAppTemplate);

      let context = {
        scratchDir,
        publicDir,
        graph,
        pagesDir: userHasWorkspacePages ? userPagesDir : defaultTemplatesDir,
        templatesDir: userHasWorkspaceTemplates ? userTemplatesDir : defaultTemplatesDir,
        userWorkspace: userHasWorkspace ? userWorkspace : defaultTemplatesDir,
        pageTemplatePath: userHasWorkspacePageTemplate 
          ? userPageTemplate 
          : path.join(defaultTemplatesDir, 'page-template.js'),
        appTemplatePath: userHasWorkspaceAppTemplate 
          ? userAppTemplate 
          : path.join(defaultTemplatesDir, 'app-template.js'),
        indexPageTemplate: 'index.html',
        notFoundPageTemplate: '404.html'
      };

      if (!fs.existsSync(scratchDir)) {
        fs.mkdirSync(scratchDir);
      }
      resolve(context);
    } catch (err) {
      reject(err);
    }
  });
};