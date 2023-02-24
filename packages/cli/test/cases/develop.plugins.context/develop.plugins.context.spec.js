/*
 * Use Case
 * Develop with Greenwood when using a custom context plugin (e.g. installed via npm) that provides custom templates (app / page) and resources (JS / CSS); aka a "theme pack".
 *
 * User Result
 * Should start development server with expected templates being used from node_modules along with JS and CSS.
 *
 * User Command
 * greenwood develop
 *
 * User Config
 * Mock Theme Pack Plugin (from fixtures)
 *
 * Custom Workspace
 * src/
 *   pages/
 *     slides/
 *       index.md
 *     index.md
 */
import chai from 'chai';
import fs from 'fs';
import { JSDOM } from 'jsdom';
import path from 'path';
import request from 'request';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { Runner } from '../../../../../runner.js';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;
const packageJson = JSON.parse(await fs.promises.readFile(new URL('./package.json', import.meta.url), 'utf-8'));

describe('Develop Greenwood With: ', function() {
  const LABEL = 'Custom Context Plugin and Default Workspace (aka Theme Packs)';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
  const hostname = 'http://localhost';
  const port = 1984;
  let runner;

  before(function() {
    this.context = {
      hostname: `${hostname}:${port}`
    };
    runner = new Runner();
  });

  describe(LABEL, function() {

    before(async function() {
      await runner.setup(outputPath);

      return new Promise(async (resolve) => {
        setTimeout(() => {
          resolve();
        }, 5000);

        await runner.runCommand(cliPath, 'develop');
      });
    });

    runSmokeTest(['serve'], LABEL);

    describe('Develop command specific HTML behaviors', function() {
      let response = {};
      let dom;

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get({
            url: `http://127.0.0.1:${port}`,
            headers: {
              accept: 'text/html'
            }
          }, (err, res, body) => {
            if (err) {
              reject();
            }

            response = res;
            
            dom = new JSDOM(body);
            resolve();
          });
        });
      });

      it('should return a 200', function(done) {
        expect(response.statusCode).to.equal(200);
        done();
      });

      it('should have expected text from from a mock package layout/app.html in node_modules/', function(done) {
        const pageTemplateHeading = dom.window.document.querySelectorAll('body h1')[0];

        expect(pageTemplateHeading.textContent).to.be.equal('This is a custom app template from the custom layouts directory.');
        done();
      });

      it('should have expected text from from a mock package layout/page.html in node_modules/', function(done) {
        const pageTemplateHeading = dom.window.document.querySelectorAll('body h2')[0];

        expect(pageTemplateHeading.textContent).to.be.equal('This is a custom (default) page template from the custom layouts directory.');
        done();
      });

      it('should have expected text from user workspace pages/index.md', function(done) {
        const pageHeadingPrimary = dom.window.document.querySelectorAll('body h3')[0];
        const pageHeadingSecondary = dom.window.document.querySelectorAll('body h4')[0];

        expect(pageHeadingPrimary.textContent).to.be.equal('Context Plugin Theme Pack Test');
        expect(pageHeadingSecondary.textContent).to.be.equal('From user workspace pages/index.md');
        done();
      });
    });

    describe('Custom Theme Pack internal logic for resolving theme.css for local development', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get({
            url: `http://127.0.0.1:${port}/node_modules/${packageJson.name}/dist/styles/theme.css`
          }, (err, res, body) => {
            if (err) {
              reject();
            }

            response = res;
            response.body = body;

            resolve();
          });
        });
      });

      it('should return a 200', function(done) {
        expect(response.statusCode).to.equal(200);

        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers['content-type']).to.contain('text/css');
        done();
      });

      it('should correctly return CSS from the developers local files', function(done) {
        expect(response.body).to.equal(':root {\n  --color-primary: #135;\n}');

        done();
      });
    });

    describe('Custom Theme Pack internal logic for resolving greeting.js for local development', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get({
            url: `http://127.0.0.1:${port}/node_modules/${packageJson.name}/dist/components/greeting.js`
          }, (err, res, body) => {
            if (err) {
              reject();
            }

            response = res;
            response.body = body;

            resolve();
          });
        });
      });

      it('should return a 200', function(done) {
        expect(response.statusCode).to.equal(200);

        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers['content-type']).to.contain('text/javascript');
        done();
      });

      it('should correctly return JavaScript from the developers local files', function(done) {
        expect(response.body).to.contain('customElements.define(\'x-greeting\', GreetingComponent);');

        done();
      });
    });
  });

  after(function() {
    runner.stopCommand();
    runner.teardown([
      path.join(outputPath, '.greenwood')
    ]);
  });

});