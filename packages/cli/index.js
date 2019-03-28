require('colors');
const fs = require('fs');
const path = require('path');

const generateGraph = require('./lib/graph');
const generateScaffolding = require('./lib/scaffold');
const buildCompilation = require('./lib/build');
const serializeBuild = require('./lib/serialize');

const CONFIG = {
  pagesDir: path.join(__dirname, './templates/'),
  scratchDir: path.join(process.cwd(), './.greenwood/'),
  templatesDir: path.join(__dirname, './templates/'),
  publicDir: path.join(process.cwd(), './public'),
  pageTemplate: 'page-template.js',
  appTemplate: 'app-template.js',
  homeComponent: path.join(__dirname, './templates', 'index.js'),
  rootIndex: path.join(__dirname, './templates/', 'index.html'),
  default: true
};

const initDirectories = async() => {

  return new Promise((resolve, reject) => {
    try {
      const usrPagesDir = path.join(process.cwd(), './src/pages');
      const usrTemplateDir = path.join(process.cwd(), './src/templates');
    
      if(fs.existsSync(usrPagesDir)) {
        CONFIG.pagesDir = usrPagesDir;
      }
      if(fs.existsSync(usrTemplateDir)) {
        if(!fs.existsSync(path.join(usrTemplateDir, CONFIG.pageTemplate))) {
          reject("It looks like you don't have a page template defined. \n" +
          "Please include a page-template.js in your templates directory. \n" +
          "See https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/templates/page-template.js");
        }
        if(!fs.existsSync(path.join(usrTemplateDir, CONFIG.appTemplate))) {
          reject("It looks like you don't have an app template defined. \n" +
          "Please include an app-template.js in your templates directory. \n" +
          "See https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/templates/app-template.js");
        }
        /// set homepage component to user's ./src/component directory instead of def templates folder
        CONFIG.homeComponent = path.join(process.cwd(), './src/components', 'index.js');  
        /// set templates directory to user's src/templates directory
        CONFIG.templatesDir = usrTemplateDir;
        /// set default flag that we're using a user template
        CONFIG.default = false;
      }
      if (!fs.existsSync(CONFIG.scratchDir)) {
        fs.mkdirSync(CONFIG.scratchDir);
      }
      resolve();
    } catch(err) {
      reject(err);
    }
  });
};

const run = async() => {

  let compilation = {
    graph: [{ label: 'index', path: '/', template: 'page' }]
  }

  try {

    console.log('-------------------------------------'.green);
    console.log('---Greenwood Static Site Generator---'.green);
    console.log('-------------------------------------'.green);

    // determine whether to use default template or user directories
    console.log('Checking src directory');
    await initDirectories();

    // generate a graph of all pages / components to build
    console.log('Generating graph of project files...');
    let graph = await generateGraph(CONFIG, compilation);
    compilation.graph = compilation.graph.concat(graph);
    
    // generate scaffolding
    console.log('Scaffolding out application files...');
    await generateScaffolding(CONFIG, compilation);

    // build our SPA application first
    console.log('Build SPA from scaffolding...');
    await buildCompilation(CONFIG, compilation);

    // "serialize" our SPA into a static site
    await serializeBuild(CONFIG, compilation);
    
    console.log('...................................'.yellow);
    console.log('Static site generation complete!');
    // console.log('Serve with: '.cyan + 'greenwood --serve'.green);
    console.log('...................................'.yellow);

    process.exit(0);
  } catch (err) {
    console.log(err);
  }
};

run();