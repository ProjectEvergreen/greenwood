const os = require('os');
const path = require('path');
const rimraf = require('rimraf');
const { spawn } = require('child_process');

module.exports = class Setup {
  constructor(enableStdOut) {
    this.enableStdOut = enableStdOut; // debugging tests
  }

  setupWorkspace(cwd) {
    this.rootDir = cwd ? cwd : process.cwd();
    this.cwdOffset = cwd ? '../../../../' : './'; // TODO figure this out dynamically?

    this.publicDir = path.join(this.rootDir, 'public');
    this.buildDir = path.join(this.rootDir, '.greenwood');
    
    return {
      publicDir: this.publicDir
    };
  }

  teardownWorkspace() {
    rimraf.sync(this.buildDir);
    rimraf.sync(this.publicDir);
  }

  runCommand(task) {
    return new Promise(async (resolve, reject) => {
      let err = '';
      const runner = os.platform() === 'win32' ? 'node.cmd' : 'node';
      const npm = spawn(runner, [`${this.cwdOffset}packages/cli/index.js`, task], {
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