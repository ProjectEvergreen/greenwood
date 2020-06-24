const fs = require('fs-extra');
const path = require('path');
const defaultTemplatesDir = path.join(__dirname, '../templates/');
const defaultConfigDir = path.join(__dirname, '../config');
const scratchDir = path.join(process.cwd(), './.greenwood/');
const publicDir = path.join(process.cwd(), './public');

module.exports = initContexts = async({ config }) => {

  return new Promise(async (resolve, reject) => {

    try {
      const userWorkspace = path.join(config.workspace);
      const userPagesDir = path.join(userWorkspace, 'pages/');
      const userTemplatesDir = path.join(userWorkspace, 'templates/');
      const userAppTemplate = path.join(userTemplatesDir, 'app-template.js');
      const userPageTemplate = path.join(userTemplatesDir, 'page-template.js');
      const indexPageTemplate = 'index.html';
      const notFoundPageTemplate = '404.html';
      const webpackProd = 'webpack.config.prod.js';
      const webpackDev = 'webpack.config.develop.js';
      const babelConfig = 'babel.config.js';
      const postcssConfig = 'postcss.config.js';

      const userHasWorkspace = await fs.exists(userWorkspace);
      const userHasWorkspacePages = await fs.exists(userPagesDir);
      const userHasWorkspaceTemplates = await fs.exists(userTemplatesDir);
      const userHasWorkspacePageTemplate = await fs.exists(userPageTemplate);
      const userHasWorkspaceAppTemplate = await fs.exists(userAppTemplate);
      const userHasWorkspaceIndexTemplate = await fs.exists(path.join(userTemplatesDir, 'index.html'));
      const userHasWorkspaceNotFoundTemplate = await fs.exists(path.join(userTemplatesDir, '404.html'));
      const userHasWorkspaceWebpackProd = await fs.exists(path.join(process.cwd(), webpackProd));
      const userHasWorkspaceWebpackDevelop = await fs.exists(path.join(process.cwd(), webpackDev));
      const userHasWorkspaceBabel = await fs.exists(path.join(process.cwd(), babelConfig));
      const userHasWorkspacePostCSS = await fs.exists(path.join(process.cwd(), postcssConfig));

      let context = {
        scratchDir,
        publicDir,
        pagesDir: userHasWorkspacePages ? userPagesDir : defaultTemplatesDir,
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
          ? path.join(userTemplatesDir, notFoundPageTemplate)
          : path.join(defaultTemplatesDir, notFoundPageTemplate),
        indexPageTemplate,
        notFoundPageTemplate,
        assetDir: path.join(userHasWorkspace ? userWorkspace : defaultTemplatesDir, 'assets'),
        webpackProd: userHasWorkspaceWebpackProd
          ? path.join(process.cwd(), './', webpackProd)
          : path.join(defaultConfigDir, webpackProd),
        webpackDevelop: userHasWorkspaceWebpackDevelop
          ? path.join(process.cwd(), './', webpackDev)
          : path.join(defaultConfigDir, webpackDev),
        babelConfig: userHasWorkspaceBabel
          ? path.join(process.cwd(), './', babelConfig)
          : path.join(defaultConfigDir, babelConfig),
        postcssConfig: userHasWorkspacePostCSS
          ? path.join(process.cwd(), './', postcssConfig)
          : path.join(defaultConfigDir, postcssConfig)
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