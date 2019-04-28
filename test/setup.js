const os = require('os');
const { spawn } = require('child_process');
const path = require('path');
const initContext = require('../packages/cli/lib/init');

module.exports = class Setup {
  constructor(enableStdOut) {
    this.enableStdOut = enableStdOut; // debugging tests
  }

  init() {
    return new Promise(async(resolve, reject) => {
      try {
        const ctx = await initContext();
        const context = { 
          ...ctx,
          userSrc: path.join(__dirname, '..', 'src'), // static src
          userTemplates: path.join(__dirname, '..', 'src', 'templates'), // static src/templates for testing empty templates dir, redundant in #38
          testApp: path.join(__dirname, 'fixtures', 'mock-app', 'src')
        };
  
        resolve(context);
      } catch (err) {
        reject(err);
      }
    });
  }

  run(args) {
    return new Promise(async (resolve, reject) => {
      const command = os.platform() === 'win32' ? 'npm.cmd' : 'node';
      const npm = spawn(command, args);
      let err = '';

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