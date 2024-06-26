/*
 * Use Case
 * Run Greenwood develop command for SPA based project.
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
import path from 'path';
import { getDependencyFiles } from '../../../../../test/utils.js';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

function removeWhiteSpace(string = '') {
  return string
    .replace(/\n/g, '')
    .replace(/ /g, '');
}

describe('Develop Greenwood With: ', function() {
  const LABEL = 'A Single Page Application (SPA)';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
  const hostname = 'http://localhost';
  const BODY_REGEX = /<body>(.*)<\/body>/s;
  const expected = removeWhiteSpace(fs.readFileSync(path.join(outputPath, `src${path.sep}index.html`), 'utf-8').match(BODY_REGEX)[0]);

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
      const simpleCss = await getDependencyFiles(
        `${process.cwd()}/node_modules/simpledotcss/simple.css`,
        `${outputPath}/node_modules/simpledotcss/`
      );

      runner.setup(outputPath, [...simpleCss]);

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 5000);

        runner.runCommand(cliPath, 'develop', { async: true });
      });
    });

    runSmokeTest(['serve'], LABEL);

    describe('Develop command specific HTML behaviors for client side routing at root - /', function() {
      let response = {};
      let body;

      before(async function() {
        response = await fetch(`${hostname}:${port}/`, { headers: { 'Accept': 'text/html' } });
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

    describe('Develop command specific HTML behaviors for client side routing at 1 level route - /<resource>', function() {
      let response = {};
      let body;

      before(async function() {
        response = await fetch(`http://127.0.0.1:${port}/artists/`, { headers: { 'Accept': 'text/html' } });
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

    describe('Develop command specific HTML behaviors for client side routing at 1 level route - /<resource>/:id', function() {
      let response = {};
      let body;

      before(async function() {
        response = await fetch(`http://127.0.0.1:${port}/artists/1`, { headers: { 'Accept': 'text/html' } });
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

    // https://github.com/ProjectEvergreen/greenwood/issues/1064
    describe('Develop command specific workspace resolution behavior that does not think its a client side route', function() {
      let response = {};
      let body;

      before(async function() {
        response = await fetch(`http://127.0.0.1:${port}/events/main.css`);
        body = await response.clone().text();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers.get('content-type')).to.equal('text/css');
        done();
      });

      it('should return a 200', function(done) {
        expect(response.status).to.equal(200);

        done();
      });

      it('should return the expected body contents', function(done) {
        expect(body.replace(/\n/g, '').indexOf('* {  color: red;}')).to.equal(0);
        done();
      });
    });

    // https://github.com/ProjectEvergreen/greenwood/issues/803
    describe('Develop command specific node modules resolution behavior that does not think its a client side route', function() {
      let response = {};
      let body;

      before(async function() {
        response = await fetch(`http://127.0.0.1:${port}/node_modules/simpledotcss/simple.css`, {
          headers: new Headers({
            accept: 'ext/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9'
          })
        });
        body = await response.clone().text();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers.get('content-type')).to.equal('text/css');
        done();
      });

      it('should return a 200', function(done) {
        expect(response.status).to.equal(200);

        done();
      });

      it('should return the expected body contents', function(done) {
        expect(body.indexOf('/* Set the global variables for everything. Change these to use your own fonts/colours. */')).to.equal(0);
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