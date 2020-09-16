#!/usr/bin/env node

/* eslint-disable no-underscore-dangle */

// https://github.com/ProjectEvergreen/greenwood/issues/141
process.setMaxListeners(0);

// TODO require('colors');

const program = require('commander');
const generateCompilation = require('./lifecycles/compile');
// const runProdBuild = require('./tasks/build');
const runDevServer = require('./tasks/develop');
// const ejectConfigFiles = require('./tasks/eject');
const greenwoodPackageJson = require('../package.json');
// let compilation = {};
// let cmdOption = {};
let MODE = '';

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

// TODO pick build by default?  Thinking of npx usage...
if (program.parse.length === 0) {
  program.help();
}

const run = async() => {
  let compilation = {};
  
  try {
    
    switch (MODE) {

      // TODO
      // case 'build':
      //   compilation = await generateCompilation();

      //   console.log('Building project for production.'.yellow);
        
      //   await runProdBuild(compilation);

      //   console.log('...................................'.yellow);
      //   console.log('Static site generation complete!');
      //   console.log('...................................'.yellow);
        
      //   break;
      case 'develop':
        compilation = await generateCompilation();
        // console.debug('compilation', compilation);

        await runDevServer(compilation);

        break;
        // TODO
        // case 'eject'
        //   console.log('Ejecting configurations'.yellow);

        //   await ejectConfigFiles(cmdOption.all);
          
        //   console.log(`Configurations ejected successfully to ${process.cwd()}`.green);

        //   break;
      default: 
        console.info(`
          Error: missing command. try using the --help flag if 
          you're encountering issues running Greenwood.  Visit our docs for more 
          info: https://www.greenwoodjs.io/docs/
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