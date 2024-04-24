/*
 * Use Case
 * Run Greenwood with greenwoodPluginImportJsx plugin with prerendering of JSX on the server side using wc-compiler.
 *
 * User Result
 * Should generate a static Greenwood build with JSX properly prerendered.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * import { greenwoodPluginImportJsx } from '@greenwood/plugin-import-jsx';
 *
 * {
 *   prerender: true,
 *   plugins: [{
 *     greenwoodPluginImportJsx()
 *   }]
 * }
 *
 * User Workspace
 * package.json
 * src/
 *   components/
 *     footer.jsx
 *   pages/
 *     index.md
 *   templates/
 *     app.html
 *   main.js
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
  const LABEL = 'Import JSX Plugin with static pre-rendering';
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

    describe('importing JSX using ESM (import)', function() {
      let dom;
      let scripts;

      before(async function() {
        scripts = await glob.promise(path.join(this.context.publicDir, '*.js'));
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './index.html'));
      });

      it('should contain one bundled output file in the output directory', function() {
        expect(scripts.length).to.be.equal(0);
      });

      it('should have the expected content from importing values from package.json in index.html', function() {
        const headings = dom.window.document.querySelectorAll('app-footer footer h4');
        const year = new Date().getFullYear();

        expect(headings.length).to.equal(1);
        expect(headings[0].textContent.trim()).to.equal(`My Blog - ${year}`);
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });

});