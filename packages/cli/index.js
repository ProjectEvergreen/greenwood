/* eslint-disable no-underscore-dangle */
require('colors');
const chalk = require('chalk');
const path = require('path');
const program = require('commander');
const runProdBuild = require('./tasks/build');
const runDevServer = require('./tasks/develop');
const scriptPkg = require(path.join(__dirname, '../..', 'package.json'));

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
  .description('build a static site')
  .action((cmd) => {
    MODE = cmd._name;
  });
program
  .command('dev')
  .description('run development environment')
  .action((cmd) => {
    MODE = cmd._name;
  });
program
  .command('create')
  .description('generate a new static site')
  .action((cmd) => {
    MODE = cmd._name;
  });
program
  .command('serve')
  .description('serve a static site')
  .action((cmd) => {
    MODE = cmd._name;
  });

program.parse(process.argv);

if (program.parse.length === 0) {
  program.help();
}

const run = async() => {

  try {
    switch (MODE) {

      case 'build':
        await runProdBuild();
        console.log('...................................'.yellow);
        console.log('Static site generation complete!');
        console.log('Serve with: '.cyan + 'greenwood serve'.green);
        console.log('...................................'.yellow);
        break;
      case 'dev':
        console.log('Development Mode Activated');
        await runDevServer();
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
        console.log('Error: missing command. try checking --help if you\'re encountering issues');
        break;

    }
    process.exit(0); // eslint-disable-line no-process-exit
  } catch (err) {
    console.error(err);
    process.exit(1); // eslint-disable-line no-process-exit
  }
};

run();
