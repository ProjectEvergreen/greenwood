/*
 * This module can be used to run a suite of smoke tests for any CLI based test case to
 * verify default behavior and output.  Can be run a-la carte to help reduce duplication and
 * boilerplate when writing tests.
 *
 * There are a number of examples in the CLI package you can use as a reference.
 *
 */
const expect = require('chai').expect;
const fs = require('fs');
const glob = require('glob-promise');
const { JSDOM } = require('jsdom');
const path = require('path');

function publicDirectory(label) {
  describe(`Running Smoke Tests: ${label}`, function() {
    describe('Public Directory Generated Output', function() {
      it('should create a public directory', function() {
        expect(fs.existsSync(this.context.publicDir)).to.be.true;
      });

      it('should output a single index.html file (home page)', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, './index.html'))).to.be.true;
      });

      it('should output a single 404.html file (not found page)', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, './404.html'))).to.be.true;
      });

      it('should output one JS bundle file', async function() {
        expect(await glob.promise(path.join(this.context.publicDir, './index.*.bundle.js'))).to.have.lengthOf(1);
      });
    });
  });
}

function defaultNotFound(label) {
  describe(`Running Smoke Tests: ${label}`, function() {
    describe('404 (Not Found) page', function() {
      let dom;

      beforeEach(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, '404.html'));
      });

      it('should have one <script> tag in the <body>', function() {
        const scriptTags = dom.window.document.querySelectorAll('body > script');

        expect(scriptTags.length).to.be.equal(1);
      });
      
      it('should have no <script> tags in the <head>', function() {
        const scriptTags = dom.window.document.querySelectorAll('body > head');

        expect(scriptTags.length).to.be.equal(0);
      });

      it('should have a <title> tag in the <head>', function() {
        const title = dom.window.document.querySelector('head title').textContent;

        expect(title).to.be.equal('404 - Not Found');
      });

      it('should have a <h1> tag in the <body>', function() {
        const heading = dom.window.document.querySelector('body h1').textContent;

        expect(heading).to.be.equal('404 Not Found');
      });
    });
  });
}

function defaultIndex(label) {
  describe(`Running Smoke Tests: ${label}`, function() {
    describe('Index (Home) page', function() {
      const indexPageHeading = 'Greenwood';
      const indexPageBody = 'This is the home page built by Greenwood. Make your own pages in src/pages/index.js!';
      let dom;

      beforeEach(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });

      it('should have a <title> tag in the <head>', function() {
        const title = dom.window.document.querySelector('head title').textContent;

        expect(title).to.be.equal('My App');
      });

      it('should have no <script> tag in the <body>', function() {
        const scriptTags = dom.window.document.querySelectorAll('body > script');

        expect(scriptTags.length).to.be.equal(0);
      });
      
      it('should have no <script> tags in the <head>', function() {
        const scriptTags = dom.window.document.querySelectorAll('head > script');

        expect(scriptTags.length).to.be.equal(0);
      });

      it('should have a router outlet tag in the <body>', function() {
        const outlet = dom.window.document.querySelectorAll('body eve-app');

        expect(outlet.length).to.be.equal(1);
      });

      it('should have the correct route tags in the <body>', function() {
        const routes = dom.window.document.querySelectorAll('body lit-route');

        expect(routes.length).to.be.equal(2);
      });

      it('should have the expected heading text within the index page in the public directory', function() {
        const heading = dom.window.document.querySelector('h3').textContent;

        expect(heading).to.equal(indexPageHeading);
      });

      it('should have the expected paragraph text within the index page in the public directory', function() {
        const paragraph = dom.window.document.querySelector('p').textContent;

        expect(paragraph).to.equal(indexPageBody);
      });
    });
  });
}

function defaultHelloPage(label) {
  describe(`Running Smoke Tests: ${label}`, function() {
    describe('Hello World (dummy) page', function() {
      const helloPageHeading = 'Hello World';
      const helloPageBody = 'This is an example page built by Greenwood.  Make your own in src/pages!';
      let dom;

      beforeEach(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './hello', './index.html'));
      });

      it('should output a hello page directory', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, './hello'))).to.be.true;
      });

      it('should output an index.html file within the default hello page directory', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, './hello', './index.html'))).to.be.true;
      });

      it('should have the expected heading text within the hello example page in the hello directory', function() {
        const heading = dom.window.document.querySelector('h3').textContent;

        expect(heading).to.equal(helloPageHeading);
      });

      it('should have the expected paragraph text within the hello example page in the hello directory', function() {
        let paragraph = dom.window.document.querySelector('p').textContent;

        expect(paragraph).to.equal(helloPageBody);
      });
    });
  });
}

module.exports = runSmokeTest = async function(testCases, label) {

  testCases.forEach(async (testCase) => {
    switch (testCase) {

      case 'not-found':
        defaultNotFound(label);
        break;
      case 'index':
        defaultIndex(label);
        break;
      case 'hello':
        defaultHelloPage(label);
        break;
      case 'public':
        publicDirectory(label);
        break;
      default:
        console.log(`unknown case ${testCase}`); // eslint-disable-line no-console
        break;

    }
  });
};