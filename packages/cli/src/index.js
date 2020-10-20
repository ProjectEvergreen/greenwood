#!/usr/bin/env node

/* eslint-disable no-underscore-dangle */

// https://github.com/ProjectEvergreen/greenwood/issues/141
process.setMaxListeners(0);

// TODO require('colors');

const program = require('commander');
const runProductionBuild = require('./commands/build');
const runDevServer = require('./commands/develop');
const runProdServer = require('./commands/serve');
// const ejectConfigFiles = require('./tasks/eject');
const greenwoodPackageJson = require('../package.json');

let cmdOption = {};
let command = '';

// TODO
// console.log(`${chalk.rgb(175, 207, 71)('-------------------------------------------------------')}`);
// console.log(`${chalk.rgb(175, 207, 71)('Welcome to Greenwood ♻️')}`);
// console.log(`${chalk.rgb(175, 207, 71)('-------------------------------------------------------')}`);
console.info('-------------------------------------------------------');
console.info('Welcome to Greenwood ♻️');
console.info('-------------------------------------------------------');

program
  .version(greenwoodPackageJson.version)
  .arguments('<script-mode>')
  .usage('<script-mode> [options]');
// TODO .usage(`${chalk.green('<script-mode>')} [options]`);

program
  .command('build')
  .description('Build a static site for production.')
  .action((cmd) => {
    command = cmd._name;
  });

program
  .command('develop')
  .description('Start a local development server.')
  .action((cmd) => {
    command = cmd._name;
  });

program
  .command('serve')
  .description('View a production build locally with a basic web server.')
  .action((cmd) => {
    command = cmd._name;
  });

program
  .command('eject')
  .option('-a, --all', 'eject all configurations including babel, postcss, browserslistrc')
  .description('Eject greenwood configurations.')
  .action((cmd) => {
    command = cmd._name;
    cmdOption.all = cmd.all;
  });

program.parse(process.argv);

// TODO pick build by default?  Thinking of npx usage...
if (program.parse.length === 0) {
  program.help();
}

const run = async() => {  
  try {
    console.info(`Running Greenwood with the ${command} command.`);
    process.env.__GWD_COMMAND__ = command;
    
    switch (command) {

      case 'build':   
        await runProductionBuild();
        
        break;
      case 'develop':
        await runDevServer();

        break;
      case 'serve':
        process.env.__GWD_COMMAND__ = 'build';
        
        await runProductionBuild();
        await runProdServer();

        break;
        // TODO
        // case 'eject'
        //   console.log('Ejecting configurations'.yellow);

        //   await ejectConfigFiles(cmdOption.all);
          
        //   console.log(`Configurations ejected successfully to ${process.cwd()}`.green);

        //   break;
      default: 
        console.warn(`
          Error: not able to detect command. try using the --help flag if 
          you're encountering issues running Greenwood.  Visit our docs for more 
          info at https://www.greenwoodjs.io/docs/.
        `);
        break;

    }
    process.exit(0); // eslint-disable-line no-process-exit
  } catch (err) {
    console.error(err);
    process.exit(1); // eslint-disable-line no-process-exit
  }
};

run();