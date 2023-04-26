/*
 * Use Case
 * Run Greenwood with an SSR route that uses prerender configuration and also uses API routes.
 *
 * User Result
 * Should generate a bare bones Greenwood build for hosting a prerender SSR application with API route handling.
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
 *   api/
 *     greeting.js
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

// https://github.com/ProjectEvergreen/greenwood/issues/1099
describe('Serve Greenwood With: ', function() {
  const LABEL = 'A Server Rendered Application (SSR) with prerender configuration and API routes';
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
      await runner.runCommand(cliPath, 'build');

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

      // TODO no page.js output
      describe('Serve command for static HTML response with bundled home page <script> tag', function() {
        it('should have the expected <script> tags in <head>', function(done) {
          const scripts = dom.window.document.querySelectorAll('head > script');
          expect(scripts.length).to.equal(1);
          done();
        });

        it('should have the expected bundled filename', function(done) {
          const script = dom.window.document.querySelectorAll('head > script')[0];

          expect(script.getAttribute('src')).to.match(/^\/footer.*.js/);
          done();
        });
      });
    });

    describe('Serve command with API specific behaviors for a JSON API', function() {
      const name = 'Greenwood';
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}/api/greeting?name=${name}`, (err, res, body) => {
            if (err) {
              reject();
            }

            response = res;
            response.body = JSON.parse(body);

            resolve();
          });
        });
      });

      it('should return a 200 status', function(done) {
        expect(response.statusCode).to.equal(200);
        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers['content-type']).to.contain('application/json');
        done();
      });

      it('should return the correct response body', function(done) {
        expect(response.body.message).to.equal(`Hello ${name}!!!`);
        done();
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
    runner.stopCommand();
  });

});