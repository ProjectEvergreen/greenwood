#!/usr/bin/env node

/* eslint-disable no-underscore-dangle */

// https://github.com/ProjectEvergreen/greenwood/issues/141
process.setMaxListeners(0);

require('colors');

const chalk = require('chalk');
const program = require('commander');
const generateCompilation = require('./lifecycles/compile');
const runProdBuild = require('./tasks/build');
const runDevServer = require('./tasks/develop');
const ejectConfigFiles = require('./tasks/eject');
const scriptPkg = require('../package.json');
const compilation = {};
let cmdOption = {};
let MODE = '';

console.log(`${chalk.rgb(175, 207, 71)('-------------------------------------------------------')}`);
console.log(`${chalk.rgb(175, 207, 71)('Welcome to Greenwood ♻️')}`);
console.log(`${chalk.rgb(175, 207, 71)('-------------------------------------------------------')}`);

program
  .version(scriptPkg.version)
  .arguments('<script-mode>')
  .usage(`${chalk.green('<script-mode>')} [options]`);

program
  .command('build')
  .description('Build a static site for production.')
  .action((cmd) => {
    MODE = cmd._name;
  });
program
  .command('develop')
  .description('Start a local development server.')
  .action((cmd) => {
    MODE = cmd._name;
  });

program
  .command('eject')
  .option('-a, --all', 'eject all configurations including babel, postcss, browserslistrc')
  .description('Eject greenwood configurations.')
  .action((cmd) => {
    MODE = cmd._name;
    cmdOption.all = cmd.all;
  });

program.parse(process.argv);

if (program.parse.length === 0) {
  program.help();
}

const run = async() => {
  
  try {
    
    switch (MODE) {
      
      case 'build':
        compilation = await generateCompilation();

        console.log('Building project for production.'.yellow);
        
        await runProdBuild(compilation);

        console.log('...................................'.yellow);
        console.log('Static site generation complete!');
        console.log('...................................'.yellow);
        
        break;
      case 'develop':
        compilation = await generateCompilation();

        console.log('Starting local development server'.yellow);        
        
        await runDevServer(compilation);
        
        console.log('Development mode activiated'.green);

        break;
      case 'eject':
        console.log('Ejecting configurations'.yellow);

        await ejectConfigFiles(cmdOption.all);
        
        console.log(`Configurations ejected successfully to ${process.cwd()}`.green);

        break;
      default: 
        console.log('Error: missing command. try checking --help if you\'re encountering issues');
        break;

    }
    process.exit(0); // eslint-disable-line no-process-exit
  } catch (err) {
    console.error(`${err}`.red);
    process.exit(1); // eslint-disable-line no-process-exit
  }
};

run();
