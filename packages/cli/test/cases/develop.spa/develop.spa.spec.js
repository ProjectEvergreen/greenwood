/*
 * Use Case
 * Run Greenwood develop command with SPA mode setting.
 *
 * User Result
 * Should start the development server in SPA mode with client side routing support.
 *
 * User Command
 * greenwood develop
 *
 * User Config
 * {
 *   mode: 'spa'
 * }
 *
 * User Workspace
 * src/
 *   index.html
 * 
 */
const expect = require('chai').expect;
const fs = require('fs');
const { JSDOM } = require('jsdom');
const path = require('path');
const request = require('request');
const Runner = require('gallinago').Runner;
const runSmokeTest = require('../../../../../test/smoke-test');

function removeWhiteSpace(string = '') {
  return string
    .replace(/\n/g, '')
    .replace(/ /g, '');
}

describe('Develop Greenwood With: ', function() {
  const LABEL = 'SPA Mode';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = __dirname;
  const hostname = 'http://localhost';
  const BODY_REGEX = /<body>(.*)<\/body>/s;
  const expected = removeWhiteSpace(fs.readFileSync(path.join(outputPath, 'src/index.html'), 'utf-8').match(BODY_REGEX)[0]);

  const port = 1984;
  let runner;

  before(function() {
    this.context = {
      hostname: `${hostname}:${port}`
    };
    runner = new Runner(true);
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

    describe('Develop command specific HTML behaviors for client side routing at root - /', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get({
            url: `http://127.0.0.1:${port}/`,
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

      it('should return the correct content type', function(done) {
        expect(response.headers['content-type']).to.contain('text/html');
        done();
      });

      it('should return a 200', function(done) {
        expect(response.statusCode).to.equal(200);

        done();
      });

      it('should return the expected body contents', function(done) {
        expect(removeWhiteSpace(response.body.match(BODY_REGEX)[0])).to.equal(expected);
        done();
      });
    });

    describe('Develop command specific HTML behaviors for client side routing at 1 level route - /<resource>', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get({
            url: `http://127.0.0.1:${port}/artists/`,
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

      it('should return the correct content type', function(done) {
        expect(response.headers['content-type']).to.contain('text/html');
        done();
      });

      it('should return a 200', function(done) {
        expect(response.statusCode).to.equal(200);

        done();
      });

      it('should return the expected body contents', function(done) {
        expect(removeWhiteSpace(response.body.match(BODY_REGEX)[0])).to.equal(expected);
        done();
      });
    });

    describe('Develop command specific HTML behaviors for client side routing at 1 level route - /<resource>/:id', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get({
            url: `http://127.0.0.1:${port}/artists/1`,
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

      it('should return the correct content type', function(done) {
        expect(response.headers['content-type']).to.contain('text/html');
        done();
      });

      it('should return a 200', function(done) {
        expect(response.statusCode).to.equal(200);

        done();
      });

      it('should return the expected body contents', function(done) {
        expect(removeWhiteSpace(response.body.match(BODY_REGEX)[0])).to.equal(expected);
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