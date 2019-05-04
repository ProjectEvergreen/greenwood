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

// describe('building greenwood with user provided config file', () => {
//   before(async () => {
//     setup = new TestSetup();
//     CONTEXT = await setup.init();

//     // read user config file and copy it to app root
//     const userCfgFile = require(CONTEXT.userCfgPath);

//     await fs.copy(CONTEXT.userCfgPath, CONTEXT.userCfgRootPath);

//     // set new user source based on config file
//     CONTEXT.userSrc = path.join(__dirname, '..', userCfgFile.workspace);

//     // copy test app to configured source
//     await fs.copy(CONTEXT.testApp, CONTEXT.userSrc);
//     await setup.run(['./packages/cli/index.js', 'build']);
    
//     blogPageHtmlPath = path.join(CONTEXT.publicDir, 'blog', '20190326', 'index.html'); 
//   });
  
//   it('should output one JS bundle', async() => {
//     expect(await glob.promise(path.join(CONTEXT.publicDir, './**/index.*.bundle.js'))).to.have.lengthOf(1);
//   });
  
//   it('should contain a nested blog page directory', () => {
//     expect(fs.existsSync(path.join(CONTEXT.publicDir, 'blog', '20190326'))).to.be.true;
//   });
  
//   describe('nested generated blog page directory', () => {
//     const defaultHeading = 'Blog Page';
//     const defaultBody = 'This is the blog page built by Greenwood.';
//     let dom;
    
//     beforeEach(async() => {
//       dom = await JSDOM.fromFile(blogPageHtmlPath);
//     });

//     it('should contain a nested blog page with an index html file', () => {
//       expect(fs.existsSync(blogPageHtmlPath)).to.be.true;
//     });

//     it('should have the expected heading text within the blog page in the blog directory', async() => {
//       const heading = dom.window.document.querySelector('h3').textContent;
  
//       expect(heading).to.equal(defaultHeading);
//     });
  
//     it('should have the expected paragraph text within the blog page in the blog directory', async() => {
//       let paragraph = dom.window.document.querySelector('p').textContent;
  
//       expect(paragraph).to.equal(defaultBody);
//     });
//   });

//   after(async() => {
//     await fs.remove(CONTEXT.userSrc);
//     await fs.remove(CONTEXT.userCfgRootPath);
//     await fs.remove(CONTEXT.publicDir);
//     await fs.remove(CONTEXT.scratchDir);
//   });

// });

// const expect = require('chai').expect;
// const path = require('path');
// const initConfig = require('../../../packages/cli/lib/config');

// let defaultConfig = {
//   workspace: '/Users/owenbuckley/Workspace/project-evergreen/repos/greenwood/src',
//   devServer: {
//     port: 1984,
//     host: 'http://localhost'
//   },
//   publicPath: '/'
// };

// describe('Config Lib (Injected)', () => {

//   describe('Default Configuration', () => {
//     let config;

//     before(async () => {
//       config = await initConfig();
//     });

//     it('should have default value for workspace', () => {
//       expect(config.workspace).to.equal(defaultConfig.workspace);
//     });

//     it('should have default value for devServer', () => {
//       expect(config.devServer).to.exist;
//       expect(config.devServer.host).to.equal(defaultConfig.devServer.host);
//       expect(config.devServer.port).to.equal(defaultConfig.devServer.port);
//     });

//     it('should have default value for publicPath', () => {
//       expect(config.publicPath).to.equal(defaultConfig.publicPath);
//     });

//     describe('Error Handling', () => {     
//       it('should return default configuration when an empty object is passed', async () => {
//         config = await initConfig({});

//         expect(config.workspace).to.equal(defaultConfig.workspace);
//         expect(config.devServer).to.exist;
//         expect(config.devServer.host).to.equal(defaultConfig.devServer.host);
//         expect(config.devServer.port).to.equal(defaultConfig.devServer.port);
//         expect(config.publicPath).to.equal(defaultConfig.publicPath);
//       });
  
//       it('should return default configuration when garbage input is provided', async () => {
//         config = await initConfig({
//           name: 'joe',
//           age: 12
//         });

//         expect(config.workspace).to.equal(defaultConfig.workspace);
//         expect(config.devServer).to.exist;
//         expect(config.devServer.host).to.equal(defaultConfig.devServer.host);
//         expect(config.devServer.port).to.equal(defaultConfig.devServer.port);
//         expect(config.publicPath).to.equal(defaultConfig.publicPath);
//       });
//     });

//     after(async () => {
//       config = {};
//     });
//   });

//   describe('Custom Configuration: Dev Server', () => {
//     let config;
//     const customConfig = {
//       devServer: {
//         port: 1234,
//         host: 'http://projectevergreen.github.io'
//       }
//     };

//     before(async () => {
//       config = await readAndMergeConfig(customConfig);
//     });

//     it('should return custom value for devServer.port', () => {
//       expect(config.devServer.port).to.equal(customConfig.devServer.port);
//     });

//     it('should return custom value for devServer.host', () => {
//       expect(config.devServer.host).to.equal(customConfig.devServer.host);
//     });

//     // TODO error handling
//     // 'Error: the string "Error: greenwood.config.js devServer port must be an integer" was thrown, throw an Error :)');
//     // expect(model.get.bind(model, 'z')).to.throw('Property does not exist in model schema.');
//     // expect(model.get.bind(model, 'z')).to.throw(new Error('Property does not exist in model schema.'))
//     xdescribe('Error Handling', () => {
//       it('should return an error when an invalid value for devServer.port', () => {
//         expect(async () => await readAndMergeConfig({
//           devServer: {
//             port: 'abc'
//           }
//         })).to.throw(new Error('abc')); 
//       });
  
//       it('should return an error when an invalid value for devServer.port', () => {
  
//       });
//     });

//     after(async () => {
//       config = {};
//     });

//   });

//   describe('Custom Configuration: Public Path', () => {
//     let config;
//     const customConfig = {
//       publicPath: '/eve'
//     };

//     before(async () => {
//       config = await readAndMergeConfig(customConfig);
//     });

//     it('should have the expected value for publicPath', () => {
//       expect(config.publicPath).to.exist;
//       expect(config.publicPath).to.equal(customConfig.publicPath);
//     });

//     // TODO error handling
//     xdescribe('Error Handling', () => {
//       it('should return an error when a string is not provider', () => {
//         expect(async () => await readAndMergeConfig({
//           publicPath: 2
//         })).to.throw(new Error('abc')); 
//       });
//     });

//     after(async () => {
//       config = {};
//     });
//   });

//   describe('Custom Configuration: Workspace Path', () => {
//     before(async () => {
//       config = await readAndMergeConfig({
//         workspace: path.join(__dirname, '.')
//       });
//     });

//     it('should return the path provided as publicPath (if it is absolute)', () => {
//       expect(config.workspace).to.equal(defaultConfig.workspace);
//     });

//     // TODO error handling
//     xdescribe('Error Handling', () => {
//       it('should return an error when a string is not provided', () => {
//         expect(async () => await readAndMergeConfig({
//           publicPath: 2
//         })).to.throw(new Error('abc')); 
//       });
      
//       it('should return an error when the directory doesnt exist', () => {
//         expect(async () => await readAndMergeConfig({
//           publicPath: 2
//         })).to.throw(new Error('abc')); 
//       });
//     });

//     after(async () => {
//       config = {};
//     });
//   });

// });