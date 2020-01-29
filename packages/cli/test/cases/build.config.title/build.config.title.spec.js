/*
 * Use Case
 * Run Greenwood with string title in config and default workspace.
 *
 * User Result
 * Should generate a bare bones Greenwood build.  (same as build.default.spec.js) with custom title in header
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   title: 'My Custom Greenwood App'
 * }
 *
 * User Workspace
 * Greenwood default
 *  src/
 *   pages/
 *     index.md
 *     hello.md
 */
const fs = require('fs');
const { JSDOM } = require('jsdom');
const path = require('path');
const expect = require('chai').expect;
const runSmokeTest = require('../../../../../test/smoke-test');
const TestBed = require('../../../../../test/test-bed');

describe('Build Greenwood With: ', function() {
  const LABEL = 'Custom Title Configuration and Default Workspace';
  let setup;

  before(async function() {
    setup = new TestBed();
    this.context = await setup.setupTestBed(__dirname);
  });

  describe(LABEL, function() {
    before(async function() {
      await setup.runGreenwoodCommand('build');
    });
    runSmokeTest(['public', 'not-found', 'hello'], LABEL);

    describe('Custom Title', function() {
      const indexPageTitle = 'My Custom Greenwood App';
      const indexPageHeading = 'Greenwood';
      const indexPageBody = 'This is the home page built by Greenwood. Make your own pages in src/pages/index.js!';
      let dom;

      beforeEach(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './index.html'));
      });

      it('should output an index.html file within the default public directory', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, './index.html'))).to.be.true;
      });

      it('should have our custom config meta <title> tag in the <head>', function() {
        const title = dom.window.document.querySelector('head title').textContent;

        expect(title).to.be.equal(indexPageTitle);
      });

      // rest of index smoke-test because <title></title> is changed for this case
      it('should have one <script> tag in the <body>', function() {
        const scriptTag = dom.window.document.querySelectorAll('body script');

        expect(scriptTag.length).to.be.equal(1);
      });

      it('should have a router outlet tag in the <body>', function() {
        const outlet = dom.window.document.querySelectorAll('body eve-app');

        expect(outlet.length).to.be.equal(1);
      });

      it('should have the correct route tags in the <body>', function() {
        const routes = dom.window.document.querySelectorAll('body lit-route');

        expect(routes.length).to.be.equal(3);
      });

      it('should have the expected heading text within the index page in the public directory', function() {
        const heading = dom.window.document.querySelector('h3').textContent;

        expect(heading).to.equal(indexPageHeading);
      });

      it('should have the expected paragraph text within the index page in the public directory', function() {
        let paragraph = dom.window.document.querySelector('p').textContent;

        expect(paragraph).to.equal(indexPageBody);
      });
    });

    describe('Custom Front-Matter Title', function() {
      const helloPageTitle = 'Hello Page';
      let dom;

      beforeEach(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'hello', './index.html'));
      });

      it('should output an index.html file within the hello page directory', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, 'hello', './index.html'))).to.be.true;
      });

      it('should have a overridden meta <title> tag in the <head> using markdown front-matter', function() {
        const title = dom.window.document.querySelector('head title').textContent;

        expect(title).to.be.equal(helloPageTitle);
      });
    });
  });

  after(function() {
    setup.teardownTestBed();
  });
});