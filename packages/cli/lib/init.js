const fs = require('fs');
const path = require('path');

const userWorkspace = fs.existsSync(path.join(process.cwd(), 'src'))
  ? path.join(process.cwd(), 'src')
  : path.join(__dirname, '..', 'templates/');

const pagesDir = fs.existsSync(path.join(process.cwd(), 'src', 'pages'))
  ? path.join(process.cwd(), 'src', 'pages/')
  : path.join(__dirname, '..', 'templates/');

const templatesDir = fs.existsSync(path.join(process.cwd(), 'src', 'templates'))
  ? path.join(process.cwd(), 'src', 'templates/')
  : path.join(__dirname, '..', 'templates/');

module.exports = initContexts = async() => {

  return new Promise((resolve, reject) => {
    try {
      const context = {
        userWorkspace,
        pagesDir,
        scratchDir: path.join(process.cwd(), './.greenwood/'),
        templatesDir,
        publicDir: path.join(process.cwd(), './public'),
        pageTemplate: 'page-template.js',
        appTemplate: 'app-template.js'
        // default: true
      };
    
      if (fs.existsSync(templatesDir)) {
        if (!fs.existsSync(path.join(templatesDir, context.pageTemplate))) {
          reject('It looks like you don\'t have a page template defined. \n' +
          'Please include a page-template.js in your templates directory. \n' +
          'See https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/templates/page-template.js');
        }
        if (!fs.existsSync(path.join(templatesDir, context.appTemplate))) {
          reject('It looks like you don\'t have an app template defined. \n' +
          'Please include an app-template.js in your templates directory. \n' +
          'See https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/templates/app-template.js');
        }

        /// set default flag that we're using a user template
        // config.default = false;
      }
      if (!fs.existsSync(context.scratchDir)) {
        fs.mkdirSync(context.scratchDir);
      }
      resolve(context);
    } catch (err) {
      reject(err);
    }
  });
};