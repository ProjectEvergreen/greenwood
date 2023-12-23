/*
 * Use Case
 * Run Greenwood with an API and SSR routes that import CSS.
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
 *     card.css
 *   pages/
 *     products.js
 *   services/
 *     products.js
 *   styles/
 *     some.css
 */
import chai from 'chai';
import { JSDOM } from 'jsdom';
import path from 'path';
import { getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath } from 'url';

const expect = chai.expect;

describe('Serve Greenwood With: ', function() {
  const LABEL = 'A Server Rendered Application (SSR) with API Routes importing CSS';
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
      let data;
      let productsPageDom;

      before(async function() {
        response = await fetch(`${hostname}/products/`);
        data = await response.text();
        productsPageDom = new JSDOM(data);
      });

      it('should return a 200 status', function() {
        expect(response.status).to.equal(200);
      });

      it('should return the correct content type', function() {
        expect(response.headers.get('content-type')).to.equal('text/html');
      });

      it('should return a response body', function() {
        expect(data).to.not.be.undefined;
      });

      it('should have the expected import CSS in the page in the response body', function(done) {
        const styleTag = productsPageDom.window.document.querySelectorAll('body > style');

        expect(styleTag.length).to.equal(1);
        expect(styleTag[0].textContent.replace(/ /g, '').replace(/\n/, '')).contain('h1{color:red;}');
        done();
      });

      it('should make sure to have the expected CSS inlined into the page for each <app-card>', function(done) {
        const cardComponents = productsPageDom.window.document.querySelectorAll('body app-card');

        expect(cardComponents.length).to.equal(2);
        Array.from(cardComponents).forEach((card) => {
          expect(card.innerHTML).contain('display: flex;');
        });
        done();
      });
    });

    describe('Serve command with API specific behaviors for an HTML ("fragment") API', function() {
      let response = {};
      let fragmentsApiDom;

      before(async function() {
        response = await fetch(`${hostname}/api/fragment`);
        const body = await response.clone().text();
        fragmentsApiDom = new JSDOM(body);
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

      it('should make sure to have the expected CSS inlined into the page for each <app-card>', function(done) {
        const cardComponents = fragmentsApiDom.window.document.querySelectorAll('body > app-card');

        expect(cardComponents.length).to.equal(2);
        Array.from(cardComponents).forEach((card) => {
          expect(card.innerHTML).contain('display: flex;');
        });
        done();
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
    runner.stopCommand();
  });

});