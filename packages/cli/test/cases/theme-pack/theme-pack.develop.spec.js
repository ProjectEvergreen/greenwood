/*
 * Use Case
 * A theme pack _author_ creating a theme pack and using Greenwood for development and testing
 * following the guide published on the Greenwood website. (https://www.greenwoodjs.io/guides/theme-packs/)
 *
 * User Result
 * Should correctly validate the develop and build / serve commands work correctly using tge expected layouts
 * being resolved correctly per the known work around needs as documented in the FAQ and tracked in a discussion.
 * https://github.com/ProjectEvergreen/greenwood/discussions/682
 *
 * User Command
 * greenwood develop
 *
 * User Config
 * Mock Theme Pack Plugin (from fixtures)
 *
 * Plugin Author Workspace
 * src/
 *   components/
 *     header.js
 *   layouts/
 *     blog-post.html
 *   pages/
 *     index.md
 *   styles/
 *     theme.css
 */
import chai from 'chai';
import fs from 'fs';
import { JSDOM } from 'jsdom';
import path from 'path';
import { Runner } from 'gallinago';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;
const packageJson = JSON.parse(await fs.promises.readFile(new URL('./package.json', import.meta.url), 'utf-8'));

describe('Develop Greenwood With: ', function() {
  const LABEL = 'Development environment for a Theme Pack';
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

      it('should have expected text from from a mock package layouts/blog-post.html in the users workspace', function(done) {
        const pageLayoutHeading = dom.window.document.querySelectorAll('body h1')[0];

        expect(pageLayoutHeading.textContent).to.be.equal('This is the blog post layout called from the layouts directory.');
        done();
      });

      it('should have expected text from user workspace pages/index.md', function(done) {
        const heading = dom.window.document.querySelectorAll('body h2')[0];
        const paragraph = dom.window.document.querySelectorAll('body p')[0];

        expect(heading.textContent).to.be.equal('Title of blog post');
        expect(paragraph.textContent).to.be.equal('Lorum Ipsum, this is a test.');
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
        expect(body).to.equal(':root {\n  --color-primary: #135;\n  --color-secondary: #74b238;\n  --font-family: \'Optima\', sans-serif;\n}');

        done();
      });
    });

    describe('Custom Theme Pack internal logic for resolving header.js for local development', function() {
      let response = {};
      let body;

      before(async function() {
        response = await fetch(`${hostname}:${port}/node_modules/${packageJson.name}/dist/components/header.js`);
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
        expect(body).to.contain('customElements.define(\'x-header\', HeaderComponent);');

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