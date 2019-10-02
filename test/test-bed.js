/*
 * This module can be used to assist in the development of test cases that want run in a userland like environment
 * complete with an individual greenwood.config.js file and as many pages / assets / etc you need in a workspace directory
 * to simulate any "real world" project scenario you might need to test for.
 *
 * There are a number of examples in the CLI package you can use as a reference.
 *
 */
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

// needed for puppeteer - #193
const setupFiles = [{
  dir: 'node_modules/@webcomponents/webcomponentsjs',
  name: 'webcomponents-bundle.js'
}];

module.exports = class TestBed {
  constructor(enableStdOut) {
    this.rootDir = process.cwd();
    this.enableStdOut = enableStdOut; // debugging tests
  }

  setupTestBed(cwd) {
    return new Promise(async (resolve, reject) => {
      try {
        this.rootDir = cwd;
        this.publicDir = path.join(this.rootDir, 'public');
        this.buildDir = path.join(this.rootDir, '.greenwood');

        await this.teardownTestBed();

        await Promise.all(setupFiles.map((file) => {
          return new Promise(async (resolve, reject) => {
            try {
              const targetSrc = path.join(process.cwd(), file.dir, file.name);
              const targetDir = path.join(cwd, file.dir);
              const targetPath = path.join(cwd, file.dir, file.name);

              if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
              }

              await fs.copy(targetSrc, targetPath);
              resolve();
            } catch (err) {
              reject(err);
            }
          });
        }));

        resolve({
          publicDir: this.publicDir
        });
      } catch (err) {
        reject(err);
      }

    });
  }

  teardownTestBed() {
    return new Promise(async(resolve, reject) => {
      try {
        await fs.remove(path.join(this.rootDir, '.greenwood'));
        await fs.remove(path.join(this.rootDir, 'public'));

        await Promise.all(setupFiles.map((file) => {
          return fs.remove(path.join(this.rootDir, file.dir.split('/')[0]));
        }));
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  runGreenwoodCommand(task) {
    return new Promise(async (resolve, reject) => {
      let err = '';

      const cliPath = path.join(process.cwd(), './packages/cli/src/index.js');

      const runner = os.platform() === 'win32' ? 'node.cmd' : 'node';
      const npm = spawn(runner, [cliPath, task], {
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