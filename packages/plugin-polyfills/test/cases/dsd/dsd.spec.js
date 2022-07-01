/*
 * Use Case
 * Run Greenwood with Polyfills composite plugin with Declarative Shadow DOM polyfill.
 *
 * User Result
 * Should generate a bare bones Greenwood build with DSD polyfill injected into index.html.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   plugins: [
 *     ...greenwoodPluginPolyfills({
 *       dsd: true
 *     })
 *   ]
 * }
 *
 * User Workspace
 * Greenwood default
 */
import chai from 'chai';
import { JSDOM } from 'jsdom';
import path from 'path';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Declarative Shadow DOM Polyfill Plugin with default options and Default Workspace';
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

      await runner.setup(outputPath, getSetupFiles(outputPath));
      await runner.runCommand(cliPath, 'build');
    });

    runSmokeTest(['public'], LABEL);

    describe('Script tag in the <head> tag', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });

      it('should have one <script> tag for DSD polyfill loaded in the <body> tag', function() {
        const scriptTags = dom.window.document.querySelectorAll('head > script');

        expect(scriptTags.length).to.be.equal(0);
      });

      it('should have one <script> tag for DSD polyfill loaded in the <body> tag', function() {
        const scriptTags = dom.window.document.querySelectorAll('body > script');

        expect(scriptTags.length).to.be.equal(1);
      });

      it('should have the expected DSD polyfill content in the polyfill <script> tag', function() {
        const scriptTags = dom.window.document.querySelectorAll('body > script');

        expect(scriptTags[0].textContent).to.contain('(function attachShadowRoots(root) {');
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });

});