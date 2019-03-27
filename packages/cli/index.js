require('colors');
const fs = require('fs');
const path = require('path');

const generateGraph = require('./lib/graph');
const generateScaffolding = require('./lib/scaffold');
const buildCompilation = require('./lib/build');
const serializeBuild = require('./lib/serialize');

const run = async() => {
  // TODO override pages and templates if these exist from the user
  // by default assumes src/
  const CONFIG = {
    pagesDir: path.join(__dirname, './templates/'),
    scratchDir: path.join(process.cwd(), './.greenwood/'),
    templatesDir: path.join(__dirname, './templates/'),
    publicDir: path.join(process.cwd(), './public')
  };
  let compilation = {
    graph: [{ label: 'index', path: '/', template: 'page' }]
  }

  try {
    if (!fs.existsSync(CONFIG.scratchDir))
      fs.mkdirSync(CONFIG.scratchDir);

    console.log('-------------------------------------'.green);
    console.log('---Greenwood Static Site Generator---'.green);
    console.log('-------------------------------------'.green);

    // generate a graph of all pages / components to build
    console.log('Generating graph of project files...');
    let graph = await generateGraph(CONFIG, compilation);
    compilation.graph = compilation.graph.concat(graph);
    
    // generate scaffolding
    console.log('Scaffolding out application files...');
    await generateScaffolding(CONFIG, compilation);

    if (process.env.NODE_ENV !== 'development') {

      // build our SPA application first
      console.log('Build SPA from scaffolding...');
      await buildCompilation(CONFIG, compilation);

      // "serialize" our SPA into a static site
      await serializeBuild(CONFIG, compilation);

      console.log('...................................'.yellow);
      console.log('Static site generation complete!');
      // console.log('Serve with: '.cyan + 'greenwood --serve'.green);
      console.log('...................................'.yellow);
    }   
    process.exit(0);
  } catch (err) {
    console.log(err);
  }
};

run();