/*
 * This module can be used to assist in the development of test cases that want run in a userland like environment
 * complete with an individual greenwood.config.js file and as many pages / assets / etc you need in a workspace directory
 * to simulate any "real world" project scenario you might need to test for.
 * 
 * There are a number of examples in the CLI package you can use as a reference.
 *
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