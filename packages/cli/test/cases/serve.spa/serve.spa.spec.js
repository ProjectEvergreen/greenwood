/*
 * Use Case
 * Run Greenwood serve command for SPA based project.
 *
 * User Result
 * Should start the development server for a SPA with client side routing support.
 *
 * User Command
 * greenwood develop
 *
 * User Config
 * {}
 *
 * User Workspace
 * src/
 *   index.html
 *   main.css
 *
 */
import chai from 'chai';
import fs from 'fs';
import { getOutputTeardownFiles } from '../../../../../test/utils.js';
import path from 'path';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

function removeWhiteSpace(string = '') {
  return string
    .replace(/\n/g, '')
    .replace(/ /g, '');
}

describe('Serve Greenwood With: ', function() {
  const LABEL = 'A Single Page Application (SPA)';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
  const hostname = 'http://localhost';
  const BODY_REGEX = /<body>(.*)<\/body>/s;
  const expected = removeWhiteSpace(fs.readFileSync(path.join(outputPath, `src${path.sep}index.html`), 'utf-8').match(BODY_REGEX)[0]);

  const port = 8080;
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
      await runner.runCommand(cliPath, 'build');

      return new Promise(async (resolve) => {
        setTimeout(() => {
          resolve();
        }, 5000);

        await runner.runCommand(cliPath, 'serve');
      });
    });

    runSmokeTest(['serve'], LABEL);

    describe('Serve command specific HTML behaviors for client side routing at root - /', function() {
      let response = {};
      let body;

      before(async function() {
        response = await fetch(`${hostname}:${port}/`);
        body = await response.clone().text();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers.get('content-type')).to.equal('text/html');
        done();
      });

      it('should return a 200', function(done) {
        expect(response.status).to.equal(200);

        done();
      });

      it('should return the expected body contents', function(done) {
        expect(removeWhiteSpace(body.match(BODY_REGEX)[0])).to.equal(expected);
        done();
      });
    });

    describe('Serve command specific HTML behaviors for client side routing at 1 level route - /<resource>', function() {
      let response = {};
      let body;

      before(async function() {
        response = await fetch(`${hostname}:${port}/artists/`);
        body = await response.clone().text();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers.get('content-type')).to.equal('text/html');
        done();
      });

      it('should return a 200', function(done) {
        expect(response.status).to.equal(200);

        done();
      });

      it('should return the expected body contents', function(done) {
        expect(removeWhiteSpace(body.match(BODY_REGEX)[0])).to.equal(expected);
        done();
      });
    });

    describe('Serve command specific HTML behaviors for client side routing at 1 level route - /<resource>/:id', function() {
      let response = {};
      let body;

      before(async function() {
        response = await fetch(`${hostname}:${port}/artists/1`);
        body = await response.clone().text();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers.get('content-type')).to.equal('text/html');
        done();
      });

      it('should return a 200', function(done) {
        expect(response.status).to.equal(200);

        done();
      });

      it('should return the expected body contents', function(done) {
        expect(removeWhiteSpace(body.match(BODY_REGEX)[0])).to.equal(expected);
        done();
      });
    });
  });

  after(function() {
    runner.stopCommand();
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});