/*
 * Use Case
 * Run Greenwood with an API and SSR routes that import JSON.
 *
 * User Result
 * Should generate a Greenwood build that correctly builds and bundles all assets.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   plugins: [
 *      greenwoodPluginImportCss()
 *   ]
 * }
 *
 * User Workspace
 *  src/
 *   api/
 *     fragment.js
 *   components/
 *     card.js
 *   data/
 *     products.json
 *   pages/
 *     products.js
 */
import chai from 'chai';
import { JSDOM } from 'jsdom';
import path from 'path';
import { getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath } from 'url';

const expect = chai.expect;

describe('Serve Greenwood With: ', function() {
  const LABEL = 'A Server Rendered Application (SSR) with API Routes importing JSON';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
  const hostname = 'http://localhost:8080';
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

    describe('Serve command with HTML route response for products page', function() {
      let response = {};
      let dom;

      before(async function() {
        response = await fetch(`${hostname}/products/`);
        const body = await response.clone().text();
        dom = new JSDOM(body);
      });

      it('should return a 200 status', function() {
        expect(response.status).to.equal(200);
      });

      it('should return the correct content type', function() {
        expect(response.headers.get('content-type')).to.equal('text/html');
      });

      it('should make sure to have the expected number of <app-card> components on the page', function(done) {
        const cardComponents = dom.window.document.querySelectorAll('body app-card');

        expect(cardComponents.length).to.equal(2);
        done();
      });
    });

    describe('Serve command with API specific behaviors for an HTML ("fragment") API', function() {
      let response = {};
      let dom;

      before(async function() {
        response = await fetch(`${hostname}/api/fragment`);
        const body = await response.clone().text();
        dom = new JSDOM(body);
      });

      it('should return a 200 status', function() {
        expect(response.status).to.equal(200);
      });

      it('should return a custom status message', function() {
        expect(response.statusText).to.equal('OK');
      });

      it('should return the correct content type', function() {
        expect(response.headers.get('content-type')).to.equal('text/html');
      });

      it('should make sure to have the expected number of <app-card> components in the fragment', function(done) {
        const cardComponents = dom.window.document.querySelectorAll('body > app-card');

        expect(cardComponents.length).to.equal(2);
        done();
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
    runner.stopCommand();
  });

});