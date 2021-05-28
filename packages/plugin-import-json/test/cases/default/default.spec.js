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
 *   assets/
 *     data.json
 *   pages/
 *     index.html
 *   scripts/
 *     main.js
 */
const expect = require('chai').expect;
const { JSDOM } = require('jsdom');
const path = require('path');
const runSmokeTest = require('../../../../../test/smoke-test');
const { getSetupFiles, getOutputTeardownFiles } = require('../../../../../test/utils');
const Runner = require('gallinago').Runner;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Import JSON Plugin with default options';
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

    describe('importing JSON using ESM (import)', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });
    
      it('should have the expected output from importing data.json in main.js', async function() {
        const scriptTagOneOutput = dom.window.document.querySelector('body > .output-json-import');

        expect(scriptTagOneOutput.textContent).to.be.equal('got json via import, status is - 200');
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });

});