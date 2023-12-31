/*
 * Use Case
 * Run Greenwood with pluginImportCss plugin with prerendering of CSS on the server side.
 *
 * User Result
 * Should generate a static Greenwood build with CSS properly prerendered.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * import { greenwoodPluginImportCss } from '@greenwood/plugin-import-css';
 *
 * {
 *   prerender: true,
 *   plugins: [{
 *     greenwoodPluginImportCss()
 *   }]
 * }
 *
 * User Workspace
 * src/
 *   components/
 *     footer.css
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
  const LABEL = 'Import CSS Plugin with static pre-rendering';
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

    describe('importing CSS using ESM (import)', function() {
      let dom;
      let scripts;

      before(async function() {
        scripts = await glob.promise(path.join(this.context.publicDir, '*.js'));
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './index.html'));
      });

      it('should contain no (CSS-in) JavaScript file in the output directory', function() {
        expect(scripts.length).to.be.equal(0);
      });

      it('should have the expected output from importing styles.css in index.html', function() {
        const styles = dom.window.document.querySelectorAll('style');

        // TODO minify CSS-in-JS?
        expect(styles.length).to.equal(1);
        expect(styles[0].textContent).to.contain('.footer { width: 90%; margin: 0 auto; padding: 0; text-align: center; }');
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });

});