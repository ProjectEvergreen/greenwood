/*
 * Default Config
 * {
 *   workspace: path.join(process.cwd(), 'src'),
 *   devServer: {
       port: 1984,
       host: 'localhost'
     },
     publicPath: '/'
 * } 
 * 
 * Default Workspace
 * src/
 *   index.html
 *   pages/
 *     index.md
 *     hello.md
 *   templates/
 *     app-template.js
 *     page-template.js
 */
const os = require('os');
const path = require('path');
const rimraf = require('rimraf');
const { spawn } = require('child_process');

module.exports = class TestBed {
  constructor(enableStdOut) {
    this.rootDir = process.cwd();
    this.enableStdOut = enableStdOut; // debugging tests
  }

  setupTestBed(cwd) {
    this.rootDir = cwd;
    this.publicDir = path.join(this.rootDir, 'public');
    this.buildDir = path.join(this.rootDir, '.greenwood');

    this.teardownTestBed();
    
    return {
      publicDir: this.publicDir
    };
  }

  teardownTestBed() {
    rimraf.sync(path.join(this.rootDir, '.greenwood'));
    rimraf.sync(path.join(this.rootDir, 'public'));
  }

  runGreenwoodCommand(task) {
    return new Promise(async (resolve, reject) => {
      let err = '';

      const runner = os.platform() === 'win32' ? 'node.cmd' : 'node';
      const npm = spawn(runner, ['../../../../packages/cli/src/index.js', task], {
        cwd: this.rootDir
      });

      npm.on('close', code => {
        if (code !== 0) {
          reject(err);
          return;
        }
        resolve();
      });

      npm.stderr.on('data', (data) => {
        err = data.toString('utf8');
        if (this.enableStdOut) {
          console.log(err); // eslint-disable-line
        }
        reject(err);
      });

      npm.stdout.on('data', (data) => {
        if (this.enableStdOut) {
          console.log(data.toString('utf8')); // eslint-disable-line
        }
      });
    });
  }
};