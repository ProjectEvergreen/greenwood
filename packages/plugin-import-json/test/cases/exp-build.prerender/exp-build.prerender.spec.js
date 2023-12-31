/*
 * Use Case
 * Run Greenwood with greenwoodPluginImportJson plugin with prerendering of JSON on the server side.
 *
 * User Result
 * Should generate a static Greenwood build with CSS properly prerendered.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * import { greenwoodPluginImportJson } from '@greenwood/plugin-import-json';
 *
 * {
 *   prerender: true,
 *   plugins: [{
 *     greenwoodPluginImportJson()
 *   }]
 * }
 *
 * User Workspace
 * package.json
 * src/
 *   components/
 *     footer.js
 *   pages/
 *     index.md
 *   templates/
 *     app.html
 */
import chai from 'chai';
import glob from 'glob-promise';
import { JSDOM } from 'jsdom';
import path from 'path';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('(Experimental) Build Greenwood With: ', function() {
  const LABEL = 'Import JSON Plugin with static pre-rendering';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
  let runner;

  before(function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner(false, true);
  });

  describe(LABEL, function() {
    before(function() {
      runner.setup(outputPath, getSetupFiles(outputPath));
      runner.runCommand(cliPath, 'build');
    });

    runSmokeTest(['public'], LABEL);

    describe('importing JSON using ESM (import)', function() {
      let dom;
      let scripts;

      before(async function() {
        scripts = await glob.promise(path.join(this.context.publicDir, '*.js'));
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './index.html'));
      });

      it('should contain no (JSON-in) JavaScript files in the output directory', function() {
        expect(scripts.length).to.be.equal(0);
      });

      it('should have the expected content from importing values from package.json in index.html', function() {
        const headings = dom.window.document.querySelectorAll('app-footer footer h4');
        const year = new Date().getFullYear();

        expect(headings.length).to.equal(1);
        expect(headings[0].textContent.trim()).to.equal(`My Blog ${year} - Built with test-plugin-import-json-build-prerender-v0.27.0-alpha.0`);
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });

});