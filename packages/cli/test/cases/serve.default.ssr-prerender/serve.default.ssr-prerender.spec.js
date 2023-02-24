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
import { JSDOM } from 'jsdom';
import path from 'path';
import { getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import request from 'request';
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

  before(async function() {
    this.context = {
      publicDir: path.join(outputPath, 'public'),
      hostname
    };
    runner = new Runner();
  });

  describe(LABEL, function() {

    before(async function() {
      await runner.setup(outputPath, getSetupFiles(outputPath));

      return new Promise(async (resolve) => {
        setTimeout(() => {
          resolve();
        }, 10000);

        await runner.runCommand(cliPath, 'serve');
      });
    });

    runSmokeTest(['public', 'index', 'serve'], LABEL);

    describe('Serve command that prerenders SSR pages', function() {
      let dom;
      let response;

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}/`, (err, res, body) => {
            if (err) {
              reject();
            }
  
            response = res;
            response.body = body;
            dom = new JSDOM(body);
  
            resolve();
          });
        });
      });

      describe('Serve command with HTML response for the home page', function() {
        it('should return a 200 status', function(done) {
          expect(response.statusCode).to.equal(200);
          done();
        });

        it('should return the correct content type', function(done) {
          expect(response.headers['content-type']).to.contain('text/html');
          done();
        });

        it('should return a response body', function(done) {
          expect(response.body).to.not.be.undefined;
          done();
        });

        it('should have the expected output for the page', function() {
          const headings = dom.window.document.querySelectorAll('body > h1');

          expect(headings.length).to.equal(1);
          expect(headings[0].textContent).to.equal('This is the home page.');
        });
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
    runner.stopCommand();
  });

});