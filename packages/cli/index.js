#!/usr/bin/env node

/* eslint-disable no-underscore-dangle */

// https://github.com/ProjectEvergreen/greenwood/issues/141
process.setMaxListeners(0);

require('colors');
const chalk = require('chalk');
const path = require('path');
const program = require('commander');
const generateCompilation = require('./src/lifecycles/compile');
const runProdBuild = require('./src/tasks/build');
const runDevServer = require('./src/tasks/develop');
const scriptPkg = require(path.join(__dirname, 'package.json'));

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

program.parse(process.argv);

if (program.parse.length === 0) {
  program.help();
}

const run = async() => {
  
  try {
    const compilation = await generateCompilation();
    
    switch (MODE) {

      case 'build':
        console.log('Building project for production.'.yellow);
        
        await runProdBuild(compilation);

        console.log('...................................'.yellow);
        console.log('Static site generation complete!');
        console.log('...................................'.yellow);
        
        break;
      case 'develop':
        console.log('Starting local development server'.yellow);        
        
        await runDevServer(compilation);
        
        console.log('Development mode activiated'.green);

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
