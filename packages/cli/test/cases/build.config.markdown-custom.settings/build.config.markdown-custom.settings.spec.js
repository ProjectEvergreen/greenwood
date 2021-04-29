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
const expect = require('chai').expect;
const path = require('path');
const { getSetupFiles, getOutputTeardownFiles } = require('../../../../../test/utils');
const Runner = require('gallinago').Runner;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Custom Markdown Configuration and Custom Workspace';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = __dirname;
  let runner;

  before(async function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner();
  });

  describe(LABEL, function() {

    before(async function() {
      await runner.setup(outputPath, getSetupFiles(outputPath));
      await runner.runCommand(cliPath, 'build');
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
    runner.teardown(getOutputTeardownFiles(outputPath));
  });

});