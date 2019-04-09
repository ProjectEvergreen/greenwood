require('colors');
const path = require('path');
const initDirectories = require('./init');
const generateGraph = require('./graph');
const generateScaffolding = require('./scaffold');

let config = {
  pagesDir: path.join(__dirname, '../templates/'),
  scratchDir: path.join(process.cwd(), './.greenwood/'),
  templatesDir: path.join(__dirname, '../templates/'),
  publicDir: path.join(process.cwd(), './public'),
  pageTemplate: 'page-template.js',
  appTemplate: 'app-template.js',
  rootComponent: path.join(__dirname, '../templates', 'index.js'),
  rootIndex: path.join(__dirname, '../templates/', 'index.html'),
  default: true
};
  
let compilation = {
  graph: []
};

module.exports = generateBuild = () => {
  return new Promise(async (resolve, reject) => {
    try {

      // determine whether to use default template or user directories
      console.log('Checking src directory');
      config = await initDirectories(config);

      // generate a graph of all pages / components to build
      console.log('Generating graph of project files...');
      let graph = await generateGraph(config, compilation);

      compilation.graph = compilation.graph.concat(graph);
    
      // generate scaffolding
      console.log('Scaffolding out application files...');
      await generateScaffolding(config, compilation);
      resolve({ config, compilation });
    } catch (err) {
      reject(err);
    }
  });
};