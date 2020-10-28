const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

class Runner {
  constructor(enableStdOut = false) {
    this.enableStdOut = enableStdOut; // debugging tests
  }

  setup(rootDir, setupFiles = []) {
    return new Promise(async (resolve, reject) => {
      try {
        if (path.isAbsolute(rootDir)) {

          if (!fs.existsSync(rootDir)) {
            fs.mkdirSync(rootDir);
          }

          this.rootDir = rootDir;

          await Promise.all(setupFiles.map((file) => {
            return new Promise(async (resolve, reject) => {
              try {
  
                await new Promise(async(resolve, reject) => {
                  try {
                    fs.mkdirSync(path.dirname(file.destination), { recursive: true });
                    fs.copyFileSync(file.source, file.destination);
                  } catch (e) {
                    reject(e);
                  }
                  
                  resolve();
                });
              } catch (e) {
                reject(e);
              }

              resolve();
            });
          }));
            
          resolve();
        } else {
          reject('Error: rootDir is not an absolute path');
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  runCommand(binPath, args) {
    return new Promise(async (resolve, reject) => {
      const cliPath = binPath;
      let err = '';
      
      const runner = os.platform() === 'win32' ? 'node.cmd' : 'node';
      const npm = spawn(runner, [cliPath, args], {
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

  teardown() {
    return new Promise(async(resolve, reject) => {
      try {
        fs.rmdirSync(this.rootDir, { recursive: true });
        
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = {
  Runner
};