const fs = require('fs');
const path = require('path');

const generateGraph = require('./lib/graph');
const generateScaffolding = require('./lib/scaffold');
const buildCompilation = require('./lib/build');
// const path = require('path');
// const serverRender = require('./renderer');
// const LocalWebServer = require('local-web-server');
// const localWebServer = new LocalWebServer();
// const staticGen = require('./generator');
// const webpack = require('webpack');
// const webpackConfig = require(path.join(process.cwd(), 'webpack.config.prod.js'));

// const host = '127.0.0.1', port = '8000';

// const startServer = async () => {

//   const cache = require(path.join(process.cwd(), './cache.json'));

//   try {
//     return await Promise.all(cache.map(file => {
//       return serverRender('http://' + host + ':' + port + file.path, file.label);
//     }));
//   } catch (err) {
//     // eslint-disable-next-line no-console
//     console.log(err);
//     return false;
//   }
// };

const run = async() => {
  // TODO override if these exist from the user, by default
  console.log('__dirname', __dirname);
  const CONFIG = {
    pagesDir: path.join(__dirname, './templates/'),
    scratchDir: path.join(process.cwd(), './.greenwood/'),
    templatesDir: path.join(__dirname, './templates/')
  };
  let compilation = {
    graph: [{ label: 'index', path: '/', template: 'page' }]
  }

  try {
    if (!fs.existsSync(CONFIG.scratchDir))
      fs.mkdirSync(CONFIG.scratchDir);

    console.log('-------------------------------------'.green);
    console.log('---Evergreen Static Site Generator---'.green);
    console.log('-------------------------------------'.green);

    // generate a graph
    compilation.graph = await generateGraph(CONFIG, compilation);
  
    // generate scaffolding
    // TODO stream this back?
    await generateScaffolding(CONFIG, compilation);

    // build our SPA application first
    await buildCompilation(); 
    
    // serve and serialize all pages

    // ().then(() => {
      // console.log('webpack build success?');

      //     const server = localWebServer.listen({
      //       port: 8000,
      //       https: false,
      //       directory: 'public',
      //       spa: 'index.html'
      //     });

      //     await startServer();
      //     server.close();
      //     // eslint-disable-next-line no-process-exit
      //     console.log('...................................'.yellow);
      //     console.log('Static site generation complete!');
      //     console.log('Serve with: '.cyan + 'npm run serve'.green);
      //     console.log('...................................'.yellow);

      //     process.exit(0);
    // });
  } catch (err) {
    console.log(err);
  }
};

run();