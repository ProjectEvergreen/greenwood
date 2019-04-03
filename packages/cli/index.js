require('colors');
const path = require('path');

const initDirectories = require('./lib/init');
const generateGraph = require('./lib/graph');
const generateScaffolding = require('./lib/scaffold');
const buildCompilation = require('./lib/build');
const serializeBuild = require('./lib/serialize');

let CONFIG = {
  pagesDir: path.join(__dirname, './templates/'),
  scratchDir: path.join(process.cwd(), './.greenwood/'),
  templatesDir: path.join(__dirname, './templates/'),
  publicDir: path.join(process.cwd(), './public'),
  pageTemplate: 'page-template.js',
  appTemplate: 'app-template.js',
  rootComponent: path.join(__dirname, './templates', 'index.js'),
  rootIndex: path.join(__dirname, './templates/', 'index.html'),
  default: true
};

const run = async() => {

  let compilation = {
    graph: []
  };

  try {

    console.log('-------------------------------------'.green);
    console.log('---Greenwood Static Site Generator---'.green);
    console.log('-------------------------------------'.green);

    // determine whether to use default template or user directories
    console.log('Checking src directory');
    CONFIG = await initDirectories(CONFIG);

    // generate a graph of all pages / components to build
    console.log('Generating graph of project files...');
    let graph = await generateGraph(CONFIG);

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

    process.exit(0); // eslint-disable-line no-process-exit
  } catch (err) {
    console.error(err);
    process.exit(1); // eslint-disable-line no-process-exit
  }
};

run();
