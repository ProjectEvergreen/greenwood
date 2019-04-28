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
        const defaultWorkspace = path.join(process.cwd(), 'src');
        const ctx = await initContext({ config: { workspace: defaultWorkspace } });
        const context = { 
          ...ctx,
          userSrc: path.join(__dirname, '..', 'src'), // static src
          userTemplates: path.join(__dirname, '..', 'src', 'templates'), // static src/templates for testing empty templates dir, redundant in #38
          testApp: path.join(__dirname, 'fixtures', 'mock-app', 'src'),
          userCfgPath: path.join(__dirname, 'fixtures', 'mock-app', 'greenwood.config.js'),
          userCfgRootPath: path.join(__dirname, '..', 'greenwood.config.js')
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