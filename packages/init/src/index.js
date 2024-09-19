#!/usr/bin/env node
/* eslint no-console: 0 */
/*
 * **Note**
 * For the time being, there is an issue that prevents us from running the install based specs for this package as part of CI.
 * https://github.com/ProjectEvergreen/greenwood/issues/787
 *
 * When adding new features to this package, please enable the tests locally and validate that the scaffolding works
 * correctly.  This applies to the following test cases:
 * - build.default
 * - develop.default
 * - init.yarn
 *
 */
import chalk from 'chalk';
import simpleGit from 'simple-git';
import commander from 'commander';
import { copyFolder } from './copy-folder.js';
import fs from 'fs';
import inquirer from 'inquirer';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath, URL } from 'url';

const projectGitHubAPIUrl = 'https://api.github.com/orgs/ProjectEvergreen/repos';
const templateStandardName = 'greenwood-template-';
let selectedTemplate = null;
const scriptPkg = JSON.parse(fs.readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf-8'));
let templateDir = fileURLToPath(new URL('./template', import.meta.url));
let TARGET_DIR = process.cwd();
const clonedTemplateDir = path.join(TARGET_DIR, '.greenwood', '.template');

console.log(`${chalk.rgb(175, 207, 71)('-------------------------------------------------------')}`);
console.log(`${chalk.rgb(175, 207, 71)('Initialize a Greenwood Project ♻️')}`);
console.log(`${chalk.rgb(175, 207, 71)('-------------------------------------------------------')}`);

const program = new commander.Command(scriptPkg.name)
  .version(scriptPkg.version)
  .usage(`${chalk.green('<application-directory>')} [options]`)
  .option('--yarn', 'Use yarn package manager instead of npm default')
  .option('--install', 'Install dependencies upon init')
  .option('--template [type]', 'Select from list of Greenwood curated templates')
  .parse(process.argv)
  .opts();

if (program.yarn) {
  console.log('Yarn Enabled');
}

// Create new package.json
const npmInit = async () => {
  const appPkg = JSON.parse(await fs.promises.readFile(path.join(templateDir, '/package.json'), 'utf-8'));

  // use installation path's folder name for packages
  appPkg.name = path.basename(TARGET_DIR);

  // make sure users get latest and greatest version of Greenwood
  // https://github.com/ProjectEvergreen/greenwood/issues/781
  // https://github.com/ProjectEvergreen/greenwood/issues/809
  appPkg.devDependencies['@greenwood/cli'] = `~${scriptPkg.version}`;

  await fs.writeFileSync(
    path.join(TARGET_DIR, 'package.json'),
    JSON.stringify(appPkg, null, 2) + os.EOL
  );
};

// Copy root and src files to target directory
const srcInit = async () => {
  let templateFiles = [];

  await createGitIgnore();

  fs.readdirSync(templateDir).forEach(file => {
    templateFiles.push(file);
  });

  if (program.yarn) {
    // we only need .npmrc if we're using npm
    // because npm struggles with peer dependencies :/
    templateFiles = templateFiles.filter(file => file !== '.npmrc');
  }

  await Promise.all(
    templateFiles.map(async file => {
      const resolvedPath = path.join(templateDir, file);

      if (fs.lstatSync(resolvedPath).isDirectory()) {
        return await copyFolder(resolvedPath, TARGET_DIR);
      } else if (await fs.existsSync(resolvedPath)) {
        return await fs.copyFileSync(
          resolvedPath,
          path.join(TARGET_DIR, file)
        );
      }
    })
  );
};

// Create the missing gitignore because npm won't publish it https://docs.npmjs.com/files/package.json#files
const createGitIgnore = () => {
  return new Promise((resolve, reject) => {

    const resolvedPath = path.join(TARGET_DIR, '.gitignore');
    const stream = fs.createWriteStream(resolvedPath);
    const patterns = ['*DS_Store', '*.log', 'node_modules/', 'public/', '.greenwood/'];

    stream.once('open', () => {
      patterns.forEach(pattern => {
        stream.write(`${pattern}\n`);
      });
      stream.end();
    });
    stream.once('close', () => {
      resolve();
    });
    stream.once('error', (err) => {
      reject(err);
    });
  });
};

// Install npm dependencies
const install = async () => {
  const pkgMng = program.yarn ? 'yarn' : 'npm'; // default to npm
  const pkgCommand = os.platform() === 'win32' ? `${pkgMng}.cmd` : pkgMng;
  const args = ['install', '--loglevel', 'error'];

  return new Promise((resolve, reject) => {

    const process = spawn(pkgCommand, args, { stdio: 'inherit' });

    process.on('close', code => {
      if (code !== 0) {
        reject({
          command: `${pkgCommand} ${args.join(' ')}`
        });
        return;
      }
      resolve();
    });
  });
};

const listAndSelectTemplate = async () => {

  const getTemplates = async () => {
    try {

      // create error response
      class HTTPResponseError extends Error {
        constructor(response, ...args) {
          super(`HTTP Error Response: ${response.status} ${response.statusText}`, ...args);
          this.response = response;
        }
      }

      // check response from repo list fetch
      const checkStatus = response => {
        if (response.ok) {
          // response.status >= 200 && response.status < 300
          return response.json();
        } else {
          console.log('Couldn\'t locate any templates, check your connection and try again');
          throw new HTTPResponseError(response);
        }
      };

      const repos = await fetch(projectGitHubAPIUrl).then(resp => checkStatus(resp));

      // assuming it did resolve but there are no templates listed
      if (!repos || repos.length === 0) {
        console.log('Couldn\'t locate any templates, check your connection and try again');
        return [];
      }

      const templateRepos = repos.filter(repo => {
        return repo.name.includes(templateStandardName);
      });

      return templateRepos.map(({ clone_url, name }) => { // eslint-disable-line camelcase
        const templateName = name.substring(templateStandardName.length, name.length);
        return { clone_url, name: templateName }; // eslint-disable-line camelcase
      });
    } catch (err) {
      throw err;
    }
  };

  const templates = await getTemplates();

  const questions = [
    {
      type: 'list',
      name: 'template',
      message: 'Which template would you like to use?',
      choices: templates.map(template => template.name),
      filter(val) {
        return val.toLowerCase();
      }
    }
  ];

  // if the user has provided one, use that, else prompt from the list
  if (typeof program.template !== 'boolean') {
    const userSelection = program.template;
    const matchedTemplate = templates.find((template) => template.name === userSelection);

    if (matchedTemplate) {
      console.debug(`using user provided template => ${userSelection}...`);
      selectedTemplate = matchedTemplate;
    } else {
      const choices = templates.map(template => template.name).join('\n');

      console.error(`unable to match user provided template "${userSelection}". please try again.  choices are ${choices}`);
    }
  } else {
    return inquirer.prompt(questions).then((answers) => {
      // set the selected template based on the selected template name
      selectedTemplate = templates.find(template => {
        return template.name === answers.template;
      });

      if (selectedTemplate) {
        console.log('Installing Selected Template:', selectedTemplate.name);
      }
    });
  }
};

const cloneTemplate = async () => {
  const git = simpleGit();

  // check if .template directory already exists, if so remove it
  if (fs.existsSync(clonedTemplateDir)) {
    fs.rmSync(clonedTemplateDir, { recursive: true, force: true });
  }

  // clone to .template directory
  console.log('clone template', selectedTemplate.name, 'to directory', clonedTemplateDir);
  try {
    await git.clone(selectedTemplate.clone_url, clonedTemplateDir);
    templateDir = clonedTemplateDir;
  } catch (e) { throw e; }
};

const cleanUp = async () => {
  if (fs.existsSync(clonedTemplateDir)) {
    fs.rmSync(clonedTemplateDir, { recursive: true, force: true });
  }
};

const run = async () => {
  try {
    const firstArg = process.argv[process.argv.length - 1].split(' ')[0];
    const taskRunner = program.yarn ? 'yarn' : 'npm run';
    const shouldChangeDirectory = !firstArg.startsWith('--') && firstArg !== '';

    if (!firstArg.startsWith('--') && firstArg !== '') {
      TARGET_DIR = path.join(TARGET_DIR, `./${firstArg}`);

      if (!fs.existsSync(TARGET_DIR)) {
        fs.mkdirSync(TARGET_DIR);
      }
    }

    console.log(`Initializing into project directory... ${TARGET_DIR}`);

    if (program.template) {
      await listAndSelectTemplate();

      if (!selectedTemplate) {
        return;
      }
      await cloneTemplate();
    }

    // map all the template files and copy them to the current working directory
    console.log('Initializing project with files...');
    await srcInit();

    console.log('Creating package.json...');
    await npmInit();

    if (program.install || program.yarn) {
      console.log('Installing project dependencies...');
      await install();
    }

    await cleanUp();

    console.log(`${chalk.rgb(175, 207, 71)('Initializing new project complete!')}`);

    if (shouldChangeDirectory) {
      console.log(`Change directories by running => cd ${firstArg}`);
    }

    console.log(`To start developing run => ${taskRunner} dev`);
  } catch (err) {
    console.error(err);
  }

  process.exit(); // eslint-disable-line no-process-exit
};

run();