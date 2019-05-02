// const expect = require('chai').expect;
// const fs = require('fs-extra');
// const path = require('path');
// const glob = require('glob-promise');
// const TestSetup = require('./setup');
// const jsdom = require('jsdom');
// const { JSDOM } = jsdom;
// let CONTEXT;

// describe('building greenwood with default context (no user workspace)', () => {

//   before(async () => {
//     setup = new TestSetup();
//     CONTEXT = await setup.init();

//     await setup.run(['./packages/cli/index.js', 'build']);
//   });

//   it('should create a public directory', () => {
//     expect(fs.existsSync(CONTEXT.publicDir)).to.be.true;
//   });

//   describe('public directory output', () => {  
//     it('should output a single index.html file (home page)', () => {
//       expect(fs.existsSync(path.join(CONTEXT.publicDir, './index.html'))).to.be.true;
//     });
  
//     it('should output one JS bundle file', async () => {
//       expect(await glob.promise(path.join(CONTEXT.publicDir, './index.*.bundle.js'))).to.have.lengthOf(1);
//     });

//     describe('default generated index page in public directory', () => {
//       const indexPageHeading = 'Greenwood';
//       const indexPageBody = 'This is the home page built by Greenwood. Make your own pages in src/pages/index.js!';
//       let dom;

//       beforeEach(async() => {
//         dom = await JSDOM.fromFile(path.resolve(CONTEXT.publicDir, 'index.html'));
//       });

//       it('should output an index.html file within the root public directory', () => {
//         expect(fs.existsSync(path.join(CONTEXT.publicDir, './index.html'))).to.be.true;
//       });

//       it('should have the expected heading text within the index page in the public directory', async() => {
//         const heading = dom.window.document.querySelector('h3.wc-md-index').textContent;
    
//         expect(heading).to.equal(indexPageHeading);
//       });

//       it('should have the expected paragraph text within the index page in the public directory', async() => {
//         let paragraph = dom.window.document.querySelector('p.wc-md-index').textContent;
    
//         expect(paragraph).to.equal(indexPageBody);
//       });
//     });

//     it('should create a default hello page directory', () => {
//       expect(fs.existsSync(path.join(CONTEXT.publicDir, './hello'))).to.be.true;
//     });

//     describe('default generated hello page directory', () => {
//       const helloPageHeading = 'Hello World';
//       const helloPageBody = 'This is an example page built by Greenwood.  Make your own in src/pages!';
//       let dom;

//       beforeEach(async() => {
//         dom = await JSDOM.fromFile(path.resolve(CONTEXT.publicDir, './hello', './index.html'));
//       });

//       it('should output an index.html file within the default hello page directory', () => {
//         expect(fs.existsSync(path.join(CONTEXT.publicDir, './hello', './index.html'))).to.be.true;
//       });

//       it('should have the expected heading text within the hello example page in the hello directory', async() => {
//         const heading = dom.window.document.querySelector('h3.wc-md-hello').textContent;
    
//         expect(heading).to.equal(helloPageHeading);
//       });
    
//       it('should have the expected paragraph text within the hello example page in the hello directory', async() => {
//         let paragraph = dom.window.document.querySelector('p.wc-md-hello').textContent;
    
//         expect(paragraph).to.equal(helloPageBody);
//       });
//     });
//   });

//   after(async() => {
//     await fs.remove(CONTEXT.publicDir);
//     await fs.remove(CONTEXT.scratchDir);
//   });

// });

// describe('building greenwood with a user workspace w/custom nested pages directories', () => {

//   before(async() => {
//     setup = new TestSetup();
//     CONTEXT = await setup.init();
//     // copy test app
//     await fs.copy(CONTEXT.testApp, CONTEXT.userSrc);
//     await setup.run(['./packages/cli/index.js', 'build']);
    
//     blogPageHtmlPath = path.join(CONTEXT.publicDir, 'blog', '20190326', 'index.html'); 
//     customFMPageHtmlPath = path.join(CONTEXT.publicDir, 'customfm', 'index.html'); 
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

// describe('building greenwood with user workspace that doesn\'t contain app template', () => {
//   before(async() => {
//     setup = new TestSetup();
//     CONTEXT = await setup.init();
//     // copy test app
//     await fs.copy(CONTEXT.testApp, CONTEXT.userSrc);
//     await setup.run(['./packages/cli/index.js', 'build']);
//     await fs.removeSync(path.join(CONTEXT.userSrc, 'templates', 'app-template.js'));
    
//     blogPageHtmlPath = path.join(CONTEXT.publicDir, 'blog', '20190326', 'index.html'); 
//   });

//   it('should create a public directory', () => {
//     expect(fs.existsSync(CONTEXT.publicDir)).to.be.true;
//   });

//   describe('public directory output', () => {  
//     it('should output a single index.html file (home page)', () => {
//       expect(fs.existsSync(path.join(CONTEXT.publicDir, './index.html'))).to.be.true;
//     });

//     it('should output one JS bundle', async() => {
//       expect(await glob.promise(path.join(CONTEXT.publicDir, './**/index.*.bundle.js'))).to.have.lengthOf(1);
//     });

//     it('should create a default hello page directory', () => {
//       expect(fs.existsSync(path.join(CONTEXT.publicDir, './hello'))).to.be.true;
//     });

//     describe('default generated hello page directory', () => {
//       const defaultHeading = 'Test App';
//       const defaultBody = 'This is a test app using a custom user template!';
//       let dom;

//       beforeEach(async() => {
//         dom = await JSDOM.fromFile(path.resolve(CONTEXT.publicDir, 'hello/index.html'));
//       });

//       it('should output an index.html file within the default hello page directory', () => {
//         expect(fs.existsSync(path.join(CONTEXT.publicDir, './hello', './index.html'))).to.be.true;
//       });

//       it('should have the expected heading text within the hello example page in the hello directory', async() => {
//         const heading = dom.window.document.querySelector('h3').textContent;
    
//         expect(heading).to.equal(defaultHeading);
//       });
    
//       it('should have the expected paragraph text within the hello example page in the hello directory', async() => {
//         let paragraph = dom.window.document.querySelector('p').textContent;
    
//         expect(paragraph).to.equal(defaultBody);
//       });
//     });
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
//     await fs.remove(CONTEXT.publicDir);
//     await fs.remove(CONTEXT.scratchDir);
//   });
// });

// describe('building greenwood with user workspace that doesn\'t contain page template', () => {
//   before(async() => {
//     setup = new TestSetup();
//     CONTEXT = await setup.init();
//     // copy test app
//     await fs.copy(CONTEXT.testApp, CONTEXT.userSrc);
//     await setup.run(['./packages/cli/index.js', 'build']);
//     await fs.removeSync(path.join(CONTEXT.userSrc, 'templates', 'page-template.js'));
    
//     blogPageHtmlPath = path.join(CONTEXT.publicDir, 'blog', '20190326', 'index.html'); 
//   });

//   it('should create a public directory', () => {
//     expect(fs.existsSync(CONTEXT.publicDir)).to.be.true;
//   });

//   describe('public directory output', () => {  
//     it('should output a single index.html file (home page)', () => {
//       expect(fs.existsSync(path.join(CONTEXT.publicDir, './index.html'))).to.be.true;
//     });

//     it('should output one JS bundle', async() => {
//       expect(await glob.promise(path.join(CONTEXT.publicDir, './**/index.*.bundle.js'))).to.have.lengthOf(1);
//     });

//     it('should create a default hello page directory', () => {
//       expect(fs.existsSync(path.join(CONTEXT.publicDir, './hello'))).to.be.true;
//     });

//     describe('default generated hello page directory', () => {
//       const defaultHeading = 'Test App';
//       const defaultBody = 'This is a test app using a custom user template!';
//       let dom;

//       beforeEach(async() => {
//         dom = await JSDOM.fromFile(path.resolve(CONTEXT.publicDir, 'hello/index.html'));
//       });

//       it('should output an index.html file within the default hello page directory', () => {
//         expect(fs.existsSync(path.join(CONTEXT.publicDir, './hello', './index.html'))).to.be.true;
//       });

//       it('should have the expected heading text within the hello example page in the hello directory', async() => {
//         const heading = dom.window.document.querySelector('h3').textContent;
    
//         expect(heading).to.equal(defaultHeading);
//       });
    
//       it('should have the expected paragraph text within the hello example page in the hello directory', async() => {
//         let paragraph = dom.window.document.querySelector('p').textContent;
    
//         expect(paragraph).to.equal(defaultBody);
//       });
//     });
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