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
import glob from 'glob-promise';
import { JSDOM } from 'jsdom';
import path from 'path';
import { getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
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
      });

      // TODO no page.js output
      describe('Serve command for static HTML response with bundled home page <script> tag', function() {
        it('should have the expected <script> tags in <head>', function(done) {
          const scripts = Array.from(dom.window.document.querySelectorAll('head > script')).filter(tag => !tag.getAttribute('data-gwd'));
          expect(scripts.length).to.equal(1);
          done();
        });

        it('should have the expected bundled filename', function(done) {
          const script = Array.from(dom.window.document.querySelectorAll('head > script')).filter(tag => !tag.getAttribute('data-gwd'))[0];

          expect(script.getAttribute('src')).to.match(/^\/footer.*.js/);
          done();
        });
      });
    });

    describe('Serve command with API specific behaviors for a JSON API', function() {
      const name = 'Greenwood';
      let response = {};
      let data;

      before(async function() {
        response = await fetch(`${hostname}/api/greeting?name=${name}`);
        data = await response.clone().json();
      });

      it('should return a 200 status', function(done) {
        expect(response.status).to.equal(200);
        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers.get('content-type')).to.equal('application/json');
        done();
      });

      it('should return the correct response body', function(done) {
        expect(data.message).to.equal(`Hello ${name}!!!`);
        done();
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
    runner.stopCommand();
  });

});