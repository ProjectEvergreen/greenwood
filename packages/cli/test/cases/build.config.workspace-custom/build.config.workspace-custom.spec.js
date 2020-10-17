/*
 * Use Case
 * Run Greenwood build command with custom workspace directory (absolute path) and custom pages.
 *
 * User Result
 * Should generate a Greenwood build from www directory with about and index pages.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   workspace: path.join(__dirname, 'www')
 * }
 *
 * User Workspace
 * www/
 *   pages/
 *     about.md
 *     index.md
 */
const expect = require('chai').expect;
const fs = require('fs');
const { JSDOM } = require('jsdom');
const path = require('path');
const runSmokeTest = require('../../../../../test/smoke-test');
const TestBed = require('../../../../../test/test-bed');

xdescribe('Build Greenwood With: ', function() {
  const LABEL = 'Custom Configuration for Workspace (www) and Default Greenwood configuration';
  let setup;

  before(async function() {
    setup = new TestBed();
    this.context = await setup.setupTestBed(__dirname);
  });

  describe(LABEL, function() {
    before(async function() {
      await setup.runGreenwoodCommand('build');
    });

    runSmokeTest(['public', 'index', 'not-found'], LABEL);

    describe('Custom About page', function() {
      let dom;

      beforeEach(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'about', './index.html'));
      });

      it('should output an index.html file within the custom about page directory', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, 'about', './index.html'))).to.be.true;
      });

      it('should have the expected heading text within the custom about page in the about directory', function() {
        const heading = dom.window.document.querySelector('h3').textContent;

        expect(heading).to.equal('Nested Custom About Page');
      });

      it('should have the expected paragraph text within the custom about page in the about directory', function() {
        let paragraph = dom.window.document.querySelector('p').textContent;

        expect(paragraph).to.equal('This is a custom about page built by Greenwood.');
      });
    });
  });

  after(function() {
    setup.teardownTestBed();
  });
});