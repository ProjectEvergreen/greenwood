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
 *   api/
 *     fragment.js
 *     greeting.js
 *     missing.js
 *     nothing.js
 *     submit.js
 *   components/
 *     card.js
 */
import chai from 'chai';
import path from 'path';
import { getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import request from 'request';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
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
      await runner.setup(outputPath, getSetupFiles(outputPath));
      await runner.runCommand(cliPath, 'build');

      return new Promise(async (resolve) => {
        setTimeout(() => {
          resolve();
        }, 10000);

        await runner.runCommand(cliPath, 'serve');
      });
    });

    runSmokeTest(['serve'], LABEL);

    describe('Serve command with API specific behaviors for a JSON API', function() {
      const name = 'Greenwood';
      let response = {};

      before(async function() {
        // TODO not sure why native `fetch` doesn't seem to work here, just hangs the test runner
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
        expect(response.headers['content-type']).to.equal('application/json');
        done();
      });

      it('should return the correct response body', function(done) {
        expect(response.body.message).to.equal(`Hello ${name}!!!`);
        done();
      });
    });

    describe('Serve command with API specific behaviors for an HTML ("fragment") API', function() {
      const name = 'Greenwood';
      let response = {};

      before(async function() {
        // TODO not sure why native `fetch` doesn't seem to work here, just hangs the test runner
        return new Promise((resolve, reject) => {
          request.get(`${hostname}/api/fragment?name=${name}`, (err, res, body) => {
            if (err) {
              reject();
            }

            response = res;
            response.body = body;

            resolve();
          });
        });
      });

      it('should return a 200 status', function(done) {
        expect(response.statusCode).to.equal(200);
        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers['content-type']).to.equal('text/html');
        done();
      });

      it('should return the correct response body', function(done) {
        expect(response.body).to.contain(`<h1>Hello ${name}!!!</h1>`);
        done();
      });
    });

    describe('Serve command with API specific behaviors with a minimal response', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}/api/nothing`, (err, res) => {
            if (err) {
              reject();
            }

            response = res;
            resolve();
          });
        });
      });

      it('should return a 200 status', function(done) {
        expect(response.statusCode).to.equal(200);
        done();
      });
    });

    describe('Serve command with API 404 not found behavior', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}/api/foo`, (err, res, body) => {
            if (err) {
              reject();
            }

            response = res;
            response.body = body;

            resolve();
          });
        });
      });

      it('should return a 404 status', function(done) {
        expect(response.statusCode).to.equal(404);
        done();
      });
    });

    describe('Serve command with API specific behaviors with a custom response', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}/api/missing`, (err, res, body) => {
            if (err) {
              reject();
            }

            response = res;
            response.body = body;

            resolve();
          });
        });
      });

      it('should return a 404 status', function(done) {
        expect(response.statusCode).to.equal(404);
        done();
      });

      it('should return a body of not found', function(done) {
        expect(response.body).to.equal('Not Found');
        done();
      });
    });

    describe('Serve command with POST API specific behaviors', function() {
      const name = 'Greenwood';
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.post({
            url: `${hostname}/api/submit`,
            json: true,
            body: { name }
          }, (err, res, body) => {
            if (err) {
              reject();
            }

            response = res;
            response.body = body;

            resolve(response);
          });
        });
      });

      it('should return a 200 status', function(done) {
        expect(response.statusCode).to.equal(200);
        done();
      });

      it('should return the expected response message', function(done) {
        expect(response.body).to.equal(`Thank you ${name} for your submission!`);
        done();
      });

      it('should return the expected content type header', function(done) {
        expect(response.headers['content-type']).to.equal('text/html');
        done();
      });

      it('should return the secret header in the response', function(done) {
        expect(response.headers['x-secret']).to.equal('1234');
        done();
      });
    });
  });

  after(function() {
    runner.stopCommand();
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});