/*
 * Use Case
 * Develop with Greenwood when using a custom context plugin (e.g. installed via npm) that provides custom layouts (app / page) and resources (JS / CSS); aka a "theme pack".
 *
 * User Result
 * Should start development server with expected layouts being used from node_modules along with JS and CSS.
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
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { Runner } from 'gallinago';
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
      runner.setup(outputPath);

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 5000);

        runner.runCommand(cliPath, 'develop', { async: true });
      });
    });

    runSmokeTest(['serve'], LABEL);

    describe('Develop command specific HTML behaviors', function() {
      let response = {};
      let dom;

      before(async function() {
        response = await fetch(`${hostname}:${port}`);
        const body = await response.clone().text();
        dom = new JSDOM(body);
      });

      it('should return a 200', function(done) {
        expect(response.status).to.equal(200);
        done();
      });

      it('should have expected text from from a mock package layout/app.html in node_modules/', function(done) {
        const pageLayoutHeading = dom.window.document.querySelectorAll('body h1')[0];

        expect(pageLayoutHeading.textContent).to.be.equal('This is a custom app layout from the custom layouts directory.');
        done();
      });

      it('should have expected text from from a mock package layout/page.html in node_modules/', function(done) {
        const pageLayoutHeading = dom.window.document.querySelectorAll('body h2')[0];

        expect(pageLayoutHeading.textContent).to.be.equal('This is a custom (default) page layout from the custom layouts directory.');
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
      let body;

      before(async function() {
        response = await fetch(`${hostname}:${port}/node_modules/${packageJson.name}/dist/styles/theme.css`);
        body = await response.clone().text();
      });

      it('should return a 200', function(done) {
        expect(response.status).to.equal(200);

        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers.get('content-type')).to.equal('text/css');
        done();
      });

      it('should correctly return CSS from the developers local files', function(done) {
        expect(body).to.equal(':root{--color-primary:#135}');

        done();
      });
    });

    describe('Custom Theme Pack internal logic for resolving greeting.js for local development', function() {
      let response = {};
      let body;

      before(async function() {
        response = await fetch(`${hostname}:${port}/node_modules/${packageJson.name}/dist/components/greeting.js`);
        body = await response.clone().text();
      });

      it('should return a 200', function(done) {
        expect(response.status).to.equal(200);

        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers.get('content-type')).to.equal('text/javascript');
        done();
      });

      it('should correctly return JavaScript from the developers local files', function(done) {
        expect(body).to.contain('customElements.define(\'x-greeting\', GreetingComponent);');

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