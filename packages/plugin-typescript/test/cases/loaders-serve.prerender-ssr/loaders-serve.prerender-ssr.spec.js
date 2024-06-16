/*
 * Use Case
 * Run Greenwood with a prerender HTML page that imports TypeScript.
 *
 * User Result
 * Should generate a Greenwood build that correctly builds and bundles all assets.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   prerender: true,
 *   plugins: [
 *      greenwoodPluginTypeScript()
 *   ]
 * }
 *
 * User Workspace
 *  src/
 *   components/
 *     card.ts
 *   pages/
 *     index.html
 */
import chai from 'chai';
import { JSDOM } from 'jsdom';
import path from 'path';
import { getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath } from 'url';

const expect = chai.expect;

describe('Serve Greenwood With: ', function() {
  const LABEL = 'A Prerendered Application (SSR) with an HTML page importing a TypeScript component';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
  const hostname = 'http://127.0.0.1:8080';
  let runner;

  before(function() {
    this.context = {
      publicDir: path.join(outputPath, 'public'),
      hostname
    };
    runner = new Runner(false, true);
  });

  describe(LABEL, function() {

    before(async function() {
      runner.setup(outputPath, getSetupFiles(outputPath));
      runner.runCommand(cliPath, 'build');

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 10000);

        runner.runCommand(cliPath, 'serve', { async: true });
      });
    });

    describe('Serve command with SSR prerender specific behaviors for an HTML page', function() {
      let response = {};
      let body;
      let fragmentsApiDom;

      before(async function() {
        response = await fetch(`${hostname}/`);
        body = await response.clone().text();
        fragmentsApiDom = new JSDOM(body);
      });

      it('should return a 200 status', function(done) {
        expect(response.status).to.equal(200);
        done();
      });

      it('should return a custom status message', function(done) {
        expect(response.statusText).to.equal('OK');
        done();
      });

      it('should have the expected pre-rendered app-card content', function(done) {
        const cardComponents = fragmentsApiDom.window.document.querySelectorAll('body > app-card');

        expect(cardComponents.length).to.equal(1);
        expect(cardComponents[0].innerHTML).to.contain('<h3>foo</h3>')

        done();
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
    runner.stopCommand();
  });

});