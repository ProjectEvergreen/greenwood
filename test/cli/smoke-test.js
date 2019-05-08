const expect = require('chai').expect;
const fs = require('fs');
const glob = require('glob-promise');
const { JSDOM } = require('jsdom');
const path = require('path');

function publicDirectory(context, label) {
  return new Promise((resolve) => {
    describe(`Running Smoke Tests: ${label}`, () => {
      describe('Public Directory Generated Output', () => {  
        it('should create a public directory', () => {
          expect(fs.existsSync(context.publicDir)).to.be.true;
        });

        it('should output a single index.html file (home page)', () => {
          expect(fs.existsSync(path.join(context.publicDir, './index.html'))).to.be.true;
        });

        it('should output a single 404.html file (not found page)', () => {
          expect(fs.existsSync(path.join(context.publicDir, './404.html'))).to.be.true;
        });
    
        it('should output one JS bundle file', async () => {
          expect(await glob.promise(path.join(context.publicDir, './index.*.bundle.js'))).to.have.lengthOf(1);
        });
      });
    
      resolve();
    });
  });
}

function defaultIndex(context, label) {
  return new Promise((resolve) => {
    describe(`Running Smoke Tests: ${label}`, () => {
      describe('Index (Home) page', () => {
        const indexPageHeading = 'Greenwood';
        const indexPageBody = 'This is the home page built by Greenwood. Make your own pages in src/pages/index.js!';
        let dom;

        beforeEach(async() => {
          dom = await JSDOM.fromFile(path.resolve(context.publicDir, 'index.html'));
        });

        it('should have a <title> tag in the <head>', () => {
          const title = dom.window.document.querySelector('head title').textContent;

          expect(title).to.be.equal('My App');
        });

        it('should have a <script> tag in the <body>', () => {
          const scriptTag = dom.window.document.querySelectorAll('body script');

          expect(scriptTag.length).to.be.equal(1);
        });

        it('should have a router outlet tag in the <body>', () => {
          const outlet = dom.window.document.querySelectorAll('body eve-app');

          expect(outlet.length).to.be.equal(1);
        });

        it('should have the correct route tags in the <body>', () => {
          const routes = dom.window.document.querySelectorAll('body lit-route');

          expect(routes.length).to.be.equal(3);
        });

        it('should have the expected heading text within the index page in the public directory', () => {
          const heading = dom.window.document.querySelector('h3').textContent;
      
          expect(heading).to.equal(indexPageHeading);
        });

        it('should have the expected paragraph text within the index page in the public directory', () => {
          let paragraph = dom.window.document.querySelector('p').textContent;
      
          expect(paragraph).to.equal(indexPageBody);
        });
      });
    });

    resolve();
  });
}

function defaultNotFound(context, label) {
  return new Promise((resolve) => {
    describe(`Running Smoke Tests: ${label}`, () => {
      describe('404 (Not Found) page', () => {
        let dom;
  
        beforeEach(async() => {
          dom = await JSDOM.fromFile(path.resolve(context.publicDir, '404.html'));
        });
  
        it('should have a <script> tag in the <body>', () => {
          const scriptTag = dom.window.document.querySelectorAll('body script');

          expect(scriptTag.length).to.be.equal(1);
        });

        it('should have a <title> tag in the <head>', () => {
          const title = dom.window.document.querySelector('head title').textContent;

          expect(title).to.be.equal('404 - Not Found');
        });

        it('should have a <h1> tag in the <body>', () => {
          const heading = dom.window.document.querySelector('body h1').textContent;

          expect(heading).to.be.equal('404 Not Found');
        });
      });
    });
  
    resolve();
  });
}

function defaultHelloPage(context, label) {
  return new Promise((resolve) => {
    describe(`Running Smoke Tests: ${label}`, () => {
      describe('Hello World (dummy) page', () => {
        const helloPageHeading = 'Hello World';
        const helloPageBody = 'This is an example page built by Greenwood.  Make your own in src/pages!';
        let dom;

        beforeEach(async() => {
          dom = await JSDOM.fromFile(path.resolve(context.publicDir, './hello', './index.html'));
        });

        it('should output a hello page directory', () => {
          expect(fs.existsSync(path.join(context.publicDir, './hello'))).to.be.true;
        });

        it('should output an index.html file within the default hello page directory', () => {
          expect(fs.existsSync(path.join(context.publicDir, './hello', './index.html'))).to.be.true;
        });

        it('should have the expected heading text within the hello example page in the hello directory', () => {
          const heading = dom.window.document.querySelector('h3').textContent;

          expect(heading).to.equal(helloPageHeading);
        });

        it('should have the expected paragraph text within the hello example page in the hello directory', () => {
          let paragraph = dom.window.document.querySelector('p').textContent;

          expect(paragraph).to.equal(helloPageBody);
        });
      });
  
      resolve();
    });
  });
}

// TOOD need to find a good Promise based way to call setup.teardownTestBed() after all tests are run
// right now, test files are left over after tests are run, but are cleaned up before each test run
module.exports = runSmokeTest = async (testCases, context, setup, label, page) => {
  let testCasePromises = [];

  testCases.forEach(async (testCase) => {
    switch (testCase) {

      case 'not-found':
        testCasePromises.push(await defaultNotFound(context, label));
        break;
      case 'index':
        testCasePromises.push(await defaultIndex(context, label));
        break;
      case 'hello':
        testCasePromises.push(await defaultHelloPage(context, label));
        break;
      case 'public':
        testCasePromises.push(await publicDirectory(context, label));
        break;
      default:
        console.log(`unknown case ${testCase}`); // eslint-disable-line console
        break;

    }
  });

  return Promise.all(testCasePromises).catch(() => {
    console.log('oops?');
  });

};