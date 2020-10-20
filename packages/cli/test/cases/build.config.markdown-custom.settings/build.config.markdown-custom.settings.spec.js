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
const fs = require('fs');
const path = require('path');
const expect = require('chai').expect;
const TestBed = require('../../../../../test/test-bed');

xdescribe('Build Greenwood With: ', function() {
  const LABEL = 'Custom Markdown Configuration and Custom Workspace';
  let setup;

  before(async function() {
    setup = new TestBed();

    this.context = await setup.setupTestBed(__dirname);
  });

  describe(LABEL, function() {
    describe('Custom Markdown Presets', function() {

      // gfm: false disables things like fenced code blocks https://www.npmjs.com/package/remark-parse#optionsgfm
      it('should intentionally fail to compile using our custom markdown preset settings', async function() {
        try {
          await setup.runGreenwoodCommand('build');
        } catch (err) {
          expect(fs.existsSync(path.join(this.context.publicDir, './index.html'))).to.be.false;
        }
      });

    });

  });

  after(function() {
    setup.teardownTestBed();
  });

});