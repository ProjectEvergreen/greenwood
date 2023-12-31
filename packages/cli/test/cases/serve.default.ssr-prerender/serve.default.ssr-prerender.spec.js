/*
 * Use Case
 * Run Greenwood with an SSR route that is prerender using configuration.
 *
 * User Result
 * Should generate a bare bones Greenwood build for hosting a prerender SSR application.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   prerender: true
 * }
 *
 * User Workspace
 *  src/
 *   components/
 *     footer.js
 *   pages/
 *     index.js
 *   templates/
 *     app.html
 */
import chai from 'chai';
import glob from 'glob-promise';
import { JSDOM } from 'jsdom';
import path from 'path';
import { getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Serve Greenwood With: ', function() {
  const LABEL = 'A Server Rendered Application (SSR) with prerender configuration';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const hostname = 'http://127.0.0.1:8080';
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
  let runner;

  before(function() {
    this.context = {
      publicDir: path.join(outputPath, 'public'),
      hostname
    };
    runner = new Runner();
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

    runSmokeTest(['public', 'index', 'serve'], LABEL);

    describe('Serve command that prerenders SSR pages', function() {
      let dom;
      let response;
      let body;

      before(async function() {
        response = await fetch(`${hostname}/`);
        body = await response.clone().text();
        dom = new JSDOM(body);
      });

      describe('Serve command with HTML response for the home page', function() {
        it('should return a 200 status', function(done) {
          expect(response.status).to.equal(200);
          done();
        });

        it('should return the correct content type', function(done) {
          expect(response.headers.get('content-type')).to.equal('text/html');
          done();
        });

        it('should return a response body', function(done) {
          expect(body).to.not.be.undefined;
          done();
        });

        it('should have the expected output for the page', function() {
          const headings = dom.window.document.querySelectorAll('body > h1');

          expect(headings.length).to.equal(1);
          expect(headings[0].textContent).to.equal('This is the home page.');
        });

        it('should have no bundled SSR output for the page', async function() {
          const scriptFiles = (await glob.promise(path.join(this.context.publicDir, '*.js')))
            .filter(file => file.indexOf('index.js') >= 0);

          expect(scriptFiles.length).to.equal(0);
        });

        it('should have no _templates/ output directory for the app', async function() {
          const templateFiles = await glob.promise(path.join(this.context.publicDir, '_templates/*'));

          expect(templateFiles.length).to.equal(0);
        });
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
    runner.stopCommand();
  });

});