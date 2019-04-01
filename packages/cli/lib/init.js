const fs = require('fs');
const path = require('path');

module.exports = initDirectories = async(config) => {

  return new Promise((resolve, reject) => {
    try {
      const usrPagesDir = path.join(process.cwd(), './src/pages');
      const usrTemplateDir = path.join(process.cwd(), './src/templates');
    
      if (fs.existsSync(usrPagesDir)) {
        config.pagesDir = usrPagesDir;
      }
      if (fs.existsSync(usrTemplateDir)) {
        if (!fs.existsSync(path.join(usrTemplateDir, config.pageTemplate))) {
          reject('It looks like you don\'t have a page template defined. \n' +
          'Please include a page-template.js in your templates directory. \n' +
          'See https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/templates/page-template.js');
        }
        if (!fs.existsSync(path.join(usrTemplateDir, config.appTemplate))) {
          reject('It looks like you don\'t have an app template defined. \n' +
          'Please include an app-template.js in your templates directory. \n' +
          'See https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/templates/app-template.js');
        }
        /// set homepage component to user's ./src/component directory instead of def templates folder
        config.homeComponent = path.join(process.cwd(), './src/components', 'index.js');  
        /// set templates directory to user's src/templates directory
        config.templatesDir = usrTemplateDir;
        /// set default flag that we're using a user template
        config.default = false;
      }
      if (!fs.existsSync(config.scratchDir)) {
        fs.mkdirSync(config.scratchDir);
      }
      resolve(config);
    } catch (err) {
      reject(err);
    }
  });
};