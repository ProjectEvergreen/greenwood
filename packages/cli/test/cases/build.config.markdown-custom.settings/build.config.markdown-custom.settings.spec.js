/*
 * Use Case
 * Run Greenwood with custom markdown settings in greenwood config.
 *
 * User Result
 * Should generate a bare bones Greenwood build.  (same as build.default.spec.js) with custom markdown and rehype links
 *
 * User Command
 * greenwood build
 *
 * User Config
 * markdown: {
 *  settings: { gfm: false }
 * }
 *
 * User Workspace
 * src/
 *   pages/
 *     index.md
 */
const { JSDOM } = require('jsdom');
const path = require('path');
const expect = require('chai').expect;
const TestBed = require('../../../../../test/test-bed');

describe('Build Greenwood With: ', function() {
  const LABEL = 'Custom Markdown Configuration and Custom Workspace';
  let setup;

  before(async function() {
    setup = new TestBed();

    this.context = await setup.setupTestBed(__dirname);
  });

  describe(LABEL, function() {

    before(async function() {
      await setup.runGreenwoodCommand('build');
    });

    describe('Custom Markdown Presets', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });

      // gfm: false disables things like fenced code blocks https://www.npmjs.com/package/remark-parse#optionsgfm
      it('should intentionally fail to compile code fencing using our custom markdown preset settings', async function() {
        let pre = dom.window.document.querySelector('pre > code'); 

        expect(pre).to.equal(null);
      });

    });

  });

  after(function() {
    // setup.teardownTestBed();
  });

});