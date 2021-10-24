#!/usr/bin/env node
/* eslint no-console: 0 */

const copyFolder = require('./copy-folder');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const chalk = require('chalk');
const commander = require('commander');
const scriptPkg = require(path.join(__dirname, '..', '/package.json'));
const templateDir = path.join(__dirname, 'template');

let TARGET_DIR = process.cwd(); // potentially changed through an arg? 

console.log(`${chalk.rgb(175, 207, 71)('-------------------------------------------------------')}`);
console.log(`${chalk.rgb(175, 207, 71)('Initialize Greenwood Template ♻️')}`);
console.log(`${chalk.rgb(175, 207, 71)('-------------------------------------------------------')}`);

const program = new commander.Command(scriptPkg.name)
  .version(scriptPkg.version)
  .usage(`${chalk.green('<application-directory>')} [options]`)
  .option('--yarn', 'Use yarn package manager instead of npm default')
  .parse(process.argv);

if (program.yarn) {
  console.log('Yarn Enabled');
}

// Create new package.json
const npmInit = async () => {
  let appPkg = require(path.join(templateDir, 'package.json'));
  
  // use installation path's folder name for packages
  appPkg.name = path.basename(process.cwd());
  
  await fs.writeFileSync(
    path.join(TARGET_DIR, 'package.json'),
    JSON.stringify(appPkg, null, 2) + os.EOL
  );
};

// Copy root and src files to target directory
const srcInit = async () => {

  templateFolder = path.join(__dirname, 'template/');

  await createGitIgnore();

  templateFiles = [];
  fs.readdirSync(templateFolder).forEach(file => {
    templateFiles.push(file);
  });

  await Promise.all(
    templateFiles.map(async file => {
      const resolvedPath = path.join(__dirname, 'template', file);
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
    const patterns = ['*DS_Store', '*.log', 'node_modules/', 'public/', 'reports/'];

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
const install = () => {
  const pkgMng = program.yarn ? 'yarn' : 'npm'; // default to npm
  const command = os.platform() === 'win32' ? `${pkgMng}.cmd` : pkgMng;
  const installCommand = pkgMng === 'yarn' ? 'install' : 'ci';
  const args = [installCommand, '--loglevel', 'error'];

  return execCommand(command, args);
};

const execCommand = (command, args) => {
  return new Promise((resolve, reject) => {

    const process = spawn(command, args, { stdio: 'inherit' });

    process.on('close', code => {
      if (code !== 0) {
        reject({
          command: `${command} ${args.join(' ')}`
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

    // change directory to target directory
    process.chdir(path.resolve(process.cwd(), TARGET_DIR));
    
    console.log('Creating manifest (package.json)...');
    await npmInit();

    console.log(path.resolve(process.cwd(), TARGET_DIR));

    console.log('Installing project dependencies...');
    await install();

    // success!
    console.log('-------------------------------------------------------');
    console.log('Success, your project is ready to go!');
    console.log(`Just run: cd ${TARGET_DIR}`);
    console.log('And then launch your project with: npm start');
    console.log('-------------------------------------------------------');
  } catch (err) {
    console.error(err);
  }

  process.exit(); // eslint-disable-line no-process-exit
};

run();