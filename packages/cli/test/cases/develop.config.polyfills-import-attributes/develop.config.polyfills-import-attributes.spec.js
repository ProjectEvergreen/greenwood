/*
 * Use Case
 * Run Greenwood develop command with import attributes polyfill flag enabled.
 *
 * User Result
 * Should start the development server and have all the expected import attributes polyfill behaviors.
 *
 * User Command
 * greenwood develop
 *
 * User Config
 * devServer: {
 *   polyfill: {
 *     importAttributes: ['css', 'json']
 *   }
 * }
 *
 * User Workspace
 * src/
 *   components/
 *     hero.js
 *     hero.css
 *     hero.json
 *   index.html
 * greenwood.config.js
 * package.json
 */
import chai from 'chai';
import path from 'path';
import { getSetupFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Develop Greenwood With: ', function() {
  const LABEL = 'Import Maps Polyfill Configuration';
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

      runner.setup(outputPath, [
        ...getSetupFiles(outputPath)
      ]);

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 5000);

        runner.runCommand(cliPath, 'develop', { async: true });
      });
    });

    describe('Import Attributes Polyfill Behaviors for the initiating JavaScript file (hero.js)', function() {
      let response = {};
      let text;

      before(async function() {
        response = await fetch(`${hostname}:${port}/components/hero.js`, {
          headers: {
            accept: 'text/html'
          }
        });

        text = await response.clone().text();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers.get('content-type')).to.contain('text/javascript');
        done();
      });

      it('should return a 200', function(done) {
        expect(response.status).to.equal(200);

        done();
      });

      it('should not contain import attributes syntax', function(done) {
        expect(text.replace(/ /g, '')).to.not.contain('with{type:');

        done();
      });

      it('should contain import attributes polyfill syntax for CSS', function(done) {
        expect(text.replace(/ /g, '')).to.contain('importsheetfrom\'./hero.css?polyfill=type-css\'');

        done();
      });

      it('should contain import attributes polyfill syntax for JSON', function(done) {
        expect(text.replace(/ /g, '')).to.contain('importjsonfrom\'./hero.json?polyfill=type-json\'');

        done();
      });
    });

    describe('Import Attributes Polyfill Behavior for CSS', function() {
      let response = {};
      let text;

      before(async function() {
        response = await fetch(`${hostname}:${port}/components/hero.css?polyfill=type-css`, {
          headers: {
            accept: 'text/html'
          }
        });

        console.log('CSS???', await response.clone().text());
        text = await response.clone().text();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers.get('content-type')).to.contain('text/javascript');
        done();
      });

      it('should return a 200', function(done) {
        expect(response.status).to.equal(200);

        done();
      });

      it('should return the contents as an exported Constructable StyleSheet ES module', function(done) {
        expect(text).to.equal('const sheet = new CSSStyleSheet();sheet.replaceSync(`:host h2{font-size:3em}`);export default sheet;');

        done();
      });
    });

    describe('Import Attributes Polyfill Behavior for JSON', function() {
      let response = {};
      let text;

      before(async function() {
        response = await fetch(`${hostname}:${port}/components/hero.json?polyfill=type-json`, {
          headers: {
            accept: 'text/html'
          }
        });

        console.log('CSJSONS???', await response.clone().text());
        text = await response.clone().text();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers.get('content-type')).to.contain('text/javascript');
        done();
      });

      it('should return a 200', function(done) {
        expect(response.status).to.equal(200);

        done();
      });

      it('should return the contents as an exported Constructable StyleSheet ES module', function(done) {
        expect(text).to.equal('export default {"msg":"Hello World"}');

        done();
      });
    });
  });

  after(function() {
    runner.stopCommand();
    runner.teardown([
      path.join(outputPath, '.greenwood'),
      path.join(outputPath, 'node_modules')
    ]);
  });
});