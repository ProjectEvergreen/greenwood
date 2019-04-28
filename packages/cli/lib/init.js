const fs = require('fs');
const path = require('path');
const greenwoodWorkspace = path.join(__dirname, '..');
const defaultTemplateDir = path.join(greenwoodWorkspace, 'templates/');

module.exports = initContexts = async({ config }) => {
  
  return new Promise((resolve, reject) => {
    
    try {
      const defaultSrc = config.source;

      const userWorkspace = fs.existsSync(defaultSrc)
        ? defaultSrc
        : defaultTemplateDir;

      const pagesDir = fs.existsSync(path.join(userWorkspace, 'pages'))
        ? path.join(userWorkspace, 'pages/')
        : defaultTemplateDir;

      const templatesDir = fs.existsSync(path.join(userWorkspace, 'templates'))
        ? path.join(userWorkspace, 'templates/')
        : defaultTemplateDir;

      const context = {
        userWorkspace,
        pagesDir,
        scratchDir,
        templatesDir,
        publicDir: path.join(process.cwd(), './public'),
        pageTemplate: 'page-template.js',
        appTemplate: 'app-template.js',
        indexPageTemplate: 'index.html',
        notFoundPageTemplate: '404.html'
      };
    
      // TODO allow per template overrides
      if (fs.existsSync(context.templatesDir)) {
        
        // https://github.com/ProjectEvergreen/greenwood/issues/30
        if (!fs.existsSync(path.join(context.templatesDir, context.pageTemplate))) {
          reject('It looks like you don\'t have a page template defined. \n' +
          'Please include a page-template.js in your templates directory. \n' +
          'See https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/templates/page-template.js');
        }

        // https://github.com/ProjectEvergreen/greenwood/issues/32
        if (!fs.existsSync(path.join(context.templatesDir, context.appTemplate))) {
          reject('It looks like you don\'t have an app template defined. \n' +
          'Please include an app-template.js in your templates directory. \n' +
          'See https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/templates/app-template.js');
        }
      }
      if (!fs.existsSync(scratchDir)) {
        fs.mkdirSync(scratchDir);
      }
      resolve(context);
    } catch (err) {
      reject(err);
    }
  });
};