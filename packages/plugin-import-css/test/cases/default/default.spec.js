/*
 * Use Case
 * Run Greenwood with pluginImportCss plugin with default options.
 *
 * Uaer Result
 * Should generate a bare bones Greenwood build without erroring when using ESM (import) with CSS.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * const pluginImportCss = require('@greenwod/plugin-import-css');
 *
 * {
 *   plugins: [{
 *      ...pluginImportCss()
 *  }]
 * }
 *
 * User Workspace
 * src/
 *   main.js
 *   styles.css
 *   pages/
 *     index.html
 */
const expect = require('chai').expect;
const { JSDOM } = require('jsdom');
const path = require('path');
const runSmokeTest = require('../../../../../test/smoke-test');
const { getSetupFiles, getOutputTeardownFiles } = require('../../../../../test/utils');
const Runner = require('gallinago').Runner;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Import CSS Plugin with default options';
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

    runSmokeTest(['public', 'index'], LABEL);

    describe('importing CSS using ESM (import)', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });

      it('should have the expected output from main.js (lodash) in the page output', async function() {
        const spanTags = dom.window.document.querySelectorAll('body > span');
        
        expect(spanTags.length).to.be.equal(1);
        expect(spanTags[0].textContent).to.be.equal('import from styles.css: p {   color: red; }');
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });

});