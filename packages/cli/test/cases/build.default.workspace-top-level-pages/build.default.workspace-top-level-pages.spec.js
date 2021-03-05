/*
 * Use Case
 * Run Greenwood with default config and mixed HTML and markdown top level pages.
 *
 * Result
 * Test for correct page output and layout.
 *
 * Command
 * greenwood build
 *
 * User Config
 * None (Greenwood default)
 *
 * User Workspace
 * src/
 *   pages/
 *     about.html
 *     contact.md
 *     index.html
 */
const expect = require('chai').expect;
const fs = require('fs');
const { JSDOM } = require('jsdom');
const path = require('path');
const TestBed = require('../../../../../test/test-bed');

describe('Build Greenwood With: ', function() {
  const LABEL = 'Default Greenwood Configuration and Default Workspace w/ Top Level Pages';
  let setup;

  before(async function() {
    setup = new TestBed();
    this.context = await setup.setupTestBed(__dirname);
  });

  describe(LABEL, function() {
    before(async function() {
      await setup.runGreenwoodCommand('build');
    });

    // TODO runSmokeTest(['public', 'not-found', 'index'], LABEL);
    runSmokeTest(['public'], LABEL);

    describe('Home (index) Page', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });

      it('should create a top level home (index) page with just an index.html', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, './index.html'))).to.be.true;
      });

      it('should have the correct content for the home page', function() {
        const h1Tags = dom.window.document.querySelectorAll('h1');

        expect(h1Tags.length).to.equal(1);
        expect(h1Tags[0].textContent).to.equal('Hello from the home page!!!!');
      });
    });

    describe('About Page', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'about', 'index.html'));
      });

      it('should create a top level about page with a directory and index.html', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, 'about', 'index.html'))).to.be.true;
      });

      it('should have the correct content for the about page', function() {
        const h1Tags = dom.window.document.querySelectorAll('h1');
        const pTags = dom.window.document.querySelectorAll('p');

        expect(h1Tags.length).to.equal(1);
        expect(h1Tags[0].textContent).to.equal('Hello from about.html');

        expect(pTags.length).to.equal(1);
        expect(pTags[0].textContent).to.equal('Lorum Ipsum');
      });
    });

    describe('Contact Page', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'contact', 'index.html'));
      });

      it('should create a top level contact page with a directory and index.html', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, 'contact', 'index.html'))).to.be.true;
      });
  
      it('should have the correct content for the contact page', function() {
        const h3Tags = dom.window.document.querySelectorAll('h3');
        const pTags = dom.window.document.querySelectorAll('p');

        expect(h3Tags.length).to.equal(1);
        expect(h3Tags[0].textContent).to.equal('Contact Page');

        expect(pTags.length).to.equal(1);
        expect(pTags[0].textContent).to.equal('Thanks for contacting us.');
      });
    });
  });

  after(function() {
    setup.teardownTestBed();
  });

});