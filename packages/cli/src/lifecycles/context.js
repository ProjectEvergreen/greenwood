const fs = require('fs-extra');
const path = require('path');
const defaultTemplatesDir = path.join(__dirname, '../templates/');
const scratchDir = path.join(process.cwd(), './.greenwood/');
const publicDir = path.join(process.cwd(), './public');
const metaComponent = path.join(__dirname, '../plugins/meta');

module.exports = initContexts = async({ config }) => {

  return new Promise(async (resolve, reject) => {

    try {
      const userWorkspace = path.join(config.workspace);
      const userPagesDir = path.join(userWorkspace, 'pages/');
      const userTemplatesDir = path.join(userWorkspace, 'templates/');
      const userAppTemplate = path.join(userTemplatesDir, 'app-template.js');
      const userPageTemplate = path.join(userTemplatesDir, 'page-template.js');
      const indexPageTemplate = 'index.html';
      const notFoundPageTemplate = '404.md';

      const userHasWorkspace = await fs.exists(userWorkspace);
      const userHasWorkspacePages = await fs.exists(userPagesDir);
      const userPagesOrDefaultTemplateDir = userHasWorkspacePages ? userPagesDir : defaultTemplatesDir;
      const userHasWorkspaceTemplates = await fs.exists(userTemplatesDir);
      const userHasWorkspacePageTemplate = await fs.exists(userPageTemplate);
      const userHasWorkspaceAppTemplate = await fs.exists(userAppTemplate);
      const userHasWorkspaceIndexTemplate = await fs.exists(path.join(userTemplatesDir, 'index.html'));
      const userHasWorkspaceNotFoundTemplate = await fs.exists(path.join(userPagesOrDefaultTemplateDir, '404.md'));

      let context = {
        scratchDir,
        publicDir,
        pagesDir: userPagesOrDefaultTemplateDir,
        templatesDir: userHasWorkspaceTemplates ? userTemplatesDir : defaultTemplatesDir,
        userWorkspace: userHasWorkspace ? userWorkspace : defaultTemplatesDir,
        pageTemplatePath: userHasWorkspacePageTemplate
          ? userPageTemplate
          : path.join(defaultTemplatesDir, 'page-template.js'),
        appTemplatePath: userHasWorkspaceAppTemplate
          ? userAppTemplate
          : path.join(defaultTemplatesDir, 'app-template.js'),
        indexPageTemplatePath: userHasWorkspaceIndexTemplate
          ? path.join(userTemplatesDir, indexPageTemplate)
          : path.join(defaultTemplatesDir, indexPageTemplate),
        notFoundPageTemplatePath: userHasWorkspaceNotFoundTemplate
          ? path.join(userPagesDir, notFoundPageTemplate)
          : path.join(defaultTemplatesDir, notFoundPageTemplate),
        userHasWorkspaceNotFoundTemplate,
        indexPageTemplate,
        notFoundPageTemplate,
        metaComponent,
        assetDir: path.join(userHasWorkspace ? userWorkspace : defaultTemplatesDir, 'assets')
      };

      if (!await fs.ensureDir(scratchDir)) {
        await fs.mkdirs(scratchDir);
      }
      resolve(context);
    } catch (err) {
      console.log(err);
      reject(err);
    }
  });
};