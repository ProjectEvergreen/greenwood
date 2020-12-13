/*
 * This module can be used to assist in the development of test cases that want run in a userland like environment
 * complete with an individual greenwood.config.js file and as many pages / assets / etc you need in a workspace directory
 * to simulate any "real world" project scenario you might need to test for.
 *
 * There are a number of examples in the CLI package you can use as a reference.
 *
 */
const fs = require('fs').promises;
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

// needed for puppeteer - #193
const setupFiles = [{
  dir: 'node_modules/es-module-shims/dist',
  name: 'es-module-shims.js'
}, {
  dir: 'node_modules/@webcomponents/webcomponentsjs',
  name: 'webcomponents-bundle.js'
}];

module.exports = class TestBed {
  constructor(enableStdOut) {
    this.rootDir = process.cwd();
    this.enableStdOut = enableStdOut; // debugging tests
  }

  setupTestBed(cwd, testFiles = []) {
    return new Promise(async (resolve, reject) => {
      try {
        this.rootDir = cwd;
        this.publicDir = path.join(this.rootDir, 'public');
        this.buildDir = path.join(this.rootDir, '.greenwood');

        await this.teardownTestBed();

        await Promise.all(setupFiles.concat(testFiles).map((file) => {
          return new Promise(async (resolve, reject) => {
            try {
              const targetSrc = path.join(process.cwd(), file.dir, file.name);
              const targetDir = path.join(cwd, file.dir);
              const targetPath = path.join(cwd, file.dir, file.name);

              await new Promise(async(resolve, reject) => {
                try {
                  await fs.mkdir(targetDir, {
                    recursive: true
                  });
                  await fs.copyFile(targetSrc, targetPath);
                  resolve();
                } catch (err) {
                  reject(err);
                }
              });

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
        await fs.rmdir(path.join(this.rootDir, '.greenwood'), { recursive: true });
        await fs.rmdir(path.join(this.rootDir, 'public'), { recursive: true });

        await Promise.all(setupFiles.map((file) => {
          const dir = path.join(this.rootDir, file.dir.split('/')[0]);

          return fs.rmdir(dir, { recursive: true });
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
        cwd: this.rootDir,
        shell: true
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
          console.error(err); // eslint-disable-line
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