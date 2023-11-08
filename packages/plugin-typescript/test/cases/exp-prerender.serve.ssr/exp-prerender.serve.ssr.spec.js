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

// TODO - this should work after this issue is resolved
// https://github.com/ProjectEvergreen/wcc/issues/122
xdescribe('Serve Greenwood With: ', function() {
  const LABEL = 'A Prerendered Application (SSR) with an HTML page importing a TypeScript component';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
  const hostname = 'http://127.0.0.1:8080';
  let runner;

  before(async function() {
    this.context = {
      publicDir: path.join(outputPath, 'public'),
      hostname
    };
    runner = new Runner(false, true);
  });

  describe(LABEL, function() {

    before(async function() {
      await runner.setup(outputPath, getSetupFiles(outputPath));
      await runner.runCommand(cliPath, 'build');

      return new Promise(async (resolve) => {
        setTimeout(() => {
          resolve();
        }, 10000);

        await runner.runCommand(cliPath, 'serve');
      });
    });

    describe('Serve command with SSR prerender specific behaviors for an HTML page', function() {
      let response = {};
      let body;
      let fragmentsApiDom;

      before(async function() {
        response = await fetch(`${hostname}/artists/`);
        body = await response.clone().text();
        fragmentsApiDom = new JSDOM(body);
      });

      it('should return a 200 status', function(done) {
        expect(response.status).to.equal(200);
        done();
      });

      it('should return a custom status message', function(done) {
        expect(response.statusMessage).to.equal('OK');
        done();
      });

      it('should ...', function(done) {
        expect(fragmentsApiDom).to.not.be.undefined;
        done();
      });

      // it should return the correct h1 contents
      // it should return the correct app-card contents
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
    runner.stopCommand();
  });

});