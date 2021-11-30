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
import chai from 'chai';
import fs from 'fs';
import path from 'path';
import { getDependencyFiles } from '../../../../../test/utils.js';
import request from 'request';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { Runner } from 'gallinago';
import { URL } from 'url';

const expect = chai.expect;

function removeWhiteSpace(string = '') {
  return string
    .replace(/\n/g, '')
    .replace(/ /g, '');
}

describe('Develop Greenwood With: ', function() {
  const LABEL = 'SPA Mode';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = path.dirname(new URL('', import.meta.url).pathname);
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

      await runner.setup(outputPath, [...simpleCss]);

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
          }, (err, res) => {
            if (err) {
              reject();
            }

            response = res;
            
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
          }, (err, res) => {
            if (err) {
              reject();
            }

            response = res;
            
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
          }, (err, res) => {
            if (err) {
              reject();
            }

            response = res;
            
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

    // https://github.com/ProjectEvergreen/greenwood/issues/803
    describe('Develop command specific node modules resolution behavior that doesnt think its a client side route', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get({
            url: `http://127.0.0.1:${port}/node_modules/simpledotcss/simple.css`,
            headers: {
              accept: 'ext/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9'
            }
          }, (err, res) => {
            if (err) {
              reject();
            }

            response = res;

            resolve();
          });
        });
      });

      it('should return the correct content type', function(done) {
        expect(response.headers['content-type']).to.contain('text/css');
        done();
      });

      it('should return a 200', function(done) {
        expect(response.statusCode).to.equal(200);

        done();
      });

      it('should return the expected body contents', function(done) {
        expect(response.body.indexOf('/* Set the global variables for everything. Change these to use your own fonts/colours. */')).to.equal(0);
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