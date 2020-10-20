/*
 * Use Case
 * Run Greenwood with custom markdown preset in greenwood config.
 *
 * User Result
 * Should generate a bare bones Greenwood build.  (same as build.default.spec.js) with custom markdown and rehype links
 *
 * User Command
 * greenwood build
 *
 * User Config
 * markdown: {
 *   plugins: [
 *     require('rehype-slug'),
 *     require('rehype-autolink-headings')
 *   ]
 * }
 *
 * User Workspace
 * Greenwood default
 */
const { JSDOM } = require('jsdom');
const path = require('path');
const expect = require('chai').expect;
const runSmokeTest = require('../../../../../test/smoke-test');
const TestBed = require('../../../../../test/test-bed');

xdescribe('Build Greenwood With: ', function() {
  const LABEL = 'Custom Markdown Configuration and Default Workspace';
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

    describe('Custom Markdown Presets', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });

      it('should use our custom markdown preset rehype-autolink-headings and rehype-slug plugins', function() {
        let heading = dom.window.document.querySelector('h3 > a');
        expect(heading.getAttribute('href')).to.equal('#greenwood');
      });

    });

  });

  after(function() {
    setup.teardownTestBed();
  });

});