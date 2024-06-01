/*
 * Use Case
 * Run Greenwood serve command with no config.
 *
 * User Result
 * Should start the production server and render a bare bones Greenwood build.
 *
 * User Command
 * greenwood serve
 *
 * User Config
 * N / A
 *
 * User Workspace
 * src/
 *   pages/
 *     api/
 *       nested/
 *         endpoint.js
 *       fragment.js (isolation mode)
 *       greeting.js
 *       missing.js
 *       nothing.js
 *       submit-form-data.js
 *       submit-json.js
 *   components/
 *     card.js
 */
import chai from 'chai';
import path from 'path';
import { getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Serve Greenwood With: ', function() {
  const LABEL = 'API Routes';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
  const hostname = 'http://127.0.0.1:8080';
  let runner;

  before(function() {
    this.context = {
      hostname
    };
    runner = new Runner();
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

      it('should return a default status message', function(done) {
        // OK appears to be a Koa default when statusText is an empty string
        expect(response.statusText).to.equal('OK');
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

    describe('Serve command with API specific behaviors for an HTML ("fragment") API', function() {
      const name = 'Greenwood';
      let response = {};
      let body;

      before(async function() {
        response = await fetch(`${hostname}/api/fragment?name=${name}`);
        body = await response.clone().text();
      });

      it('should return a 200 status', function(done) {
        expect(response.status).to.equal(200);
        done();
      });

      it('should return a custom status message', function(done) {
        expect(response.statusText).to.equal('SUCCESS!!!');
        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers.get('content-type')).to.equal('text/html');
        done();
      });

      it('should return the correct response body', function(done) {
        expect(body).to.contain(`<h1>Hello ${name}!!!</h1>`);
        done();
      });
    });

    describe('Serve command with API specific behaviors with a minimal response', function() {
      let response = {};

      before(async function() {
        response = await fetch(`${hostname}/api/nothing`);
      });

      it('should return a custom status code', function(done) {
        expect(response.status).to.equal(204);
        done();
      });
    });

    describe('Serve command with API 404 not found behavior', function() {
      let response = {};

      before(async function() {
        response = await fetch(`${hostname}/api/foo`);
      });

      it('should return a 404 status', function(done) {
        expect(response.status).to.equal(404);
        done();
      });
    });

    describe('Serve command with API specific behaviors with a custom response', function() {
      let response = {};
      let body;

      before(async function() {
        response = await fetch(`${hostname}/api/missing`);
        body = await response.clone().text();
      });

      it('should return a 404 status', function(done) {
        expect(response.status).to.equal(404);
        done();
      });

      it('should return a body of not found', function(done) {
        expect(body).to.equal('Not Found');
        done();
      });
    });

    describe('Serve command with POST API specific behaviors for JSON', function() {
      const param = 'Greenwood';
      let response = {};
      let data;

      before(async function() {
        response = await fetch(`${hostname}/api/submit-json`, {
          method: 'POST',
          body: JSON.stringify({ name: param })
        });
        data = await response.clone().json();
      });

      it('should return a 200 status', function(done) {
        expect(response.status).to.equal(200);
        done();
      });

      it('should return the expected content type header', function(done) {
        expect(response.headers.get('content-type')).to.equal('application/json');
        done();
      });

      it('should return the secret header in the response', function(done) {
        expect(response.headers.get('x-secret')).to.equal('1234');
        done();
      });

      it('should return the expected response message', function(done) {
        const { message } = data;

        expect(message).to.equal(`Thank you ${param} for your submission!`);
        done();
      });
    });

    describe('Serve command with POST API specific behaviors for FormData', function() {
      const param = 'Greenwood';
      let response = {};
      let body;

      before(async function() {
        response = await fetch(`${hostname}/api/submit-form-data`, {
          method: 'POST',
          body: new URLSearchParams({ name: param }).toString(),
          headers: new Headers({
            'content-type': 'application/x-www-form-urlencoded'
          })
        });
        body = await response.clone().text();
      });

      it('should return a 200 status', function(done) {
        expect(response.status).to.equal(200);
        done();
      });

      it('should return the expected content type header', function(done) {
        expect(response.headers.get('content-type')).to.equal('text/html');
        done();
      });

      it('should return the expected response message', function(done) {
        expect(body).to.equal(`Thank you ${param} for your submission!`);
        done();
      });
    });

    describe('Serve command for nested API specific behaviors', function() {
      let response = {};
      let body;

      before(async function() {
        response = await fetch(`${hostname}/api/nested/endpoint`);
        body = await response.clone().text();
      });

      it('should return a 200 status', function(done) {
        expect(response.status).to.equal(200);
        done();
      });

      it('should return the expected content type header', function(done) {
        expect(response.headers.get('content-type')).to.equal('text/html');
        done();
      });

      it('should return the expected response message', function(done) {
        expect(body).to.equal('I am a nested API route!');
        done();
      });
    });
  });

  after(function() {
    runner.stopCommand();
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});