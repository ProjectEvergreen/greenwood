#!/usr/bin/env node

/* eslint-disable no-underscore-dangle */

// https://github.com/ProjectEvergreen/greenwood/issues/141
process.setMaxListeners(0);

const program = require('commander');
const runProductionBuild = require('./commands/build');
const runDevServer = require('./commands/develop');
const runProdServer = require('./commands/serve');
const ejectConfiguration = require('./commands/eject');
const greenwoodPackageJson = require('../package.json');

let cmdOption = {};
let command = '';

console.info('-------------------------------------------------------');
console.info(`Welcome to Greenwood (v${greenwoodPackageJson.version}) ♻️`);
console.info('-------------------------------------------------------');

program
  .version(greenwoodPackageJson.version)
  .arguments('<script-mode>')
  .usage('<script-mode> [options]');

program
  .command('build')
  .description('Build a static site for production.')
  .action((cmd) => {
    command = cmd._name;
  });

program
  .command('serverless')
  .description('Build a one off route and return the HTML.')
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
      case 'eject':
        await ejectConfiguration();

        break;
      default:
        console.warn(`
          Error: not able to detect command. try using the --help flag if
          you're encountering issues running Greenwood.  Visit our docs for more
          info at https://www.greenwoodjs.io/docs/.
        `);
        break;

    }

  } catch (err) {
    console.error(err);
    process.exit(1); // eslint-disable-line no-process-exit
  }
};

if (command === 'serverless') {
  process.env.__GWD_COMMAND__ = 'serverless';
} else {
  run();
}

async function buildRoute(route) {
  const compilation = await generateCompilation();

  return `
    <html>
      <head>
        <title>Greenwood The Edge - ${route}</title>
      </head>
      <body>
        <h1>HTML from AWS Lambda</h1>
        <pre>
          ${JSON.stringify(compilation)}
        </pre>
      </body>
    </html>
  `.replace(/\n/g, '');
}

module.exports = {
  buildRoute
};