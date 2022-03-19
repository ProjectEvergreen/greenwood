/*
 * Use Case
 * Run Greenwood with pluginImportCss plugin with default options.
 * Sets prerender: true to validate the functionality.
 * 
 * Uaer Result
 * Should generate a bare bones Greenwood build without erroring when using ESM (import) with CSS.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * const { greenwoodPluginImportJson } from '@greenwod/plugin-import-json';
 *
 * {
 *   plugins: [{
 *      ...greenwoodPluginImportJson()
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
import chai from 'chai';
import { JSDOM } from 'jsdom';
import path from 'path';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { copyDirectory, getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Import JSON Plugin with default options';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
  let runner;

  before(async function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner();
  });

  describe(LABEL, function() {
    before(async function() {
      // stub puppeteer dependency to avoid package manager installation when running specs that need prerendering
      await copyDirectory(`${process.cwd()}/node_modules/puppeteer`, `${outputPath}node_modules/puppeteer`);

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