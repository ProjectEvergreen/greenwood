require('colors');
const chalk = require('chalk');
const path = require('path');
const commander = require('commander');

const { buildDevServer } = require('./lib/build');
const serializeBuild = require('./lib/serialize');
const generateBuild = require('./lib/generate');
const scriptPkg = require(path.join(__dirname, 'package.json'));

let MODE;

console.log(`${chalk.rgb(175, 207, 71)('-------------------------------------------------------')}`);
console.log(`${chalk.rgb(175, 207, 71)('Welcome to Greenwood App ♻️')}`);
console.log(`${chalk.rgb(175, 207, 71)('-------------------------------------------------------')}`);

const program = new commander.Command(scriptPkg.name)
  .version(scriptPkg.version)
  .arguments('<script-mode>')
  .usage(`${chalk.green('<script-mode>')} [options]`)
  .action(name => {
    MODE = name;
  });

program.parse(process.argv);

const run = async() => {

  try {
    switch (MODE) {

      case 'build':
        const { config, compilation } = await generateBuild();

        console.log('Build SPA from scaffolding...');
        await serializeBuild(config, compilation);
        console.log('...................................'.yellow);
        console.log('Static site generation complete!');
        console.log('Serve with: '.cyan + 'greenwood serve'.green);
        console.log('...................................'.yellow);
        break;
      case 'dev':
        console.log('Development Mode Activated');
        await generateBuild();
        await buildDevServer();
        break;
      case 'create':
        console.log('Creating Greenwood application...');
        // Generate Greenwood application
        break;
      case 'serve':
        console.log('Now serving application at http://localhost:8000');
        // Serve Greenwood application
        break;
      default: 
        console.log('missing script command. try checking --help if you\'re encountering issues');
        break;

    }
    process.exit(0); // eslint-disable-line no-process-exit
  } catch (err) {
    console.error(err);
    process.exit(1); // eslint-disable-line no-process-exit
  }
};

run();
