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
import commander from 'commander';
import { copyFolder } from './copy-folder.js';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath, URL } from 'url';

const scriptPkg = JSON.parse(fs.readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf-8'));
const templateDir = fileURLToPath(new URL('./template', import.meta.url));
const TARGET_DIR = process.cwd();

console.log(`${chalk.rgb(175, 207, 71)('-------------------------------------------------------')}`);
console.log(`${chalk.rgb(175, 207, 71)('Initialize Greenwood Template ♻️')}`);
console.log(`${chalk.rgb(175, 207, 71)('-------------------------------------------------------')}`);

const program = new commander.Command(scriptPkg.name)
  .version(scriptPkg.version)
  .usage(`${chalk.green('<application-directory>')} [options]`)
  .option('--yarn', 'Use yarn package manager instead of npm default')
  .option('--install', 'Install dependencies upon init')
  .parse(process.argv)
  .opts();

if (program.yarn) {
  console.log('Yarn Enabled');
}

// Create new package.json
const npmInit = async () => {
  const appPkg = JSON.parse(await fs.promises.readFile(path.join(templateDir, '/package.json'), 'utf-8'));

  // use installation path's folder name for packages
  appPkg.name = path.basename(process.cwd());
  
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
  const templateFiles = [];

  await createGitIgnore();

  fs.readdirSync(templateDir).forEach(file => {
    templateFiles.push(file);
  });

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

const run = async () => {
  try {
    // map all the template files and copy them to the current working directory
    console.log('Initialzing project with files...');
    await srcInit();
    
    console.log('Creating manifest (package.json)...');
    await npmInit();

    if (program.install || program.yarn) {
      console.log('Installing project dependencies...');
      await install();
    }

    console.log(`${chalk.rgb(175, 207, 71)('Initializing new project complete!')}`);
  } catch (err) {
    console.error(err);
  }

  process.exit(); // eslint-disable-line no-process-exit
};

run();