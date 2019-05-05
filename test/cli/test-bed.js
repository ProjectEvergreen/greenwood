/*
 * Default Config
 * {
 *   workspace: path.join(process.cwd(), 'src'),
 *   devServer: {
       port: 1984,
       host: 'http://localhost'
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
      const npm = spawn(runner, ['../../../../packages/cli/index.js', task], {
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

//   describe('a custom front-matter override page directory', () => {
//     const defaultPageHeading = 'Custom FM Page';
//     const defaultPageBody = 'This is a custom fm page built by Greenwood.';
//     let dom;
    
//     beforeEach(async() => {
//       dom = await JSDOM.fromFile(customFMPageHtmlPath);
//     });

//     it('should contain a customfm folder with an index html file', () => {
//       expect(fs.existsSync(customFMPageHtmlPath)).to.be.true;
//     });

//     it('should have the expected heading text within the customfm page in the customfm directory', async() => {
//       const heading = dom.window.document.querySelector('h3.wc-md-customfm').textContent;

//       expect(heading).to.equal(defaultPageHeading);
//     });

//     it('should have the expected paragraph text within the customfm page in the customfm directory', async() => {
//       let paragraph = dom.window.document.querySelector('p.wc-md-customfm').textContent;

//       expect(paragraph).to.equal(defaultPageBody);
//     });

//     it('should have the expected blog-template\'s blog-content class', async() => {
//       let layout = dom.window.document.querySelector('.blog-content');

//       expect(layout).to.not.equal(null);
//     });
//   });

//   after(async() => {
//     await fs.remove(CONTEXT.userSrc);
//     await fs.remove(CONTEXT.publicDir);
//     await fs.remove(CONTEXT.scratchDir);
//   });
// });