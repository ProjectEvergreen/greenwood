/*
 * Use Case
 * Run Greenwood develop command with no config.
 *
 * User Result
 * Should start the development server and render a bare bones Greenwood build and return CSS file as ESM.
 *
 * User Command
 * greenwood develop
 *
 * User Config
 * Import CSS Plugin
 *
 * User Workspace
 * src/
 *   main.css
 *
 */
const expect = require('chai').expect;
const path = require('path');
const request = require('request');
const Runner = require('gallinago').Runner;
const runSmokeTest = require('../../../../../test/smoke-test');

describe('Develop Greenwood With: ', function() {
  const LABEL = 'Import CSS plugin for using ESM with .css files';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = __dirname;
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
      await runner.setup(outputPath);

      return new Promise(async (resolve) => {
        setTimeout(() => {
          resolve();
        }, 5000);

        await runner.runCommand(cliPath, 'develop');
      });
    });

    runSmokeTest(['serve'], LABEL);

    describe('Develop command specific ESM .css behaviors', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get({
            url: `http://127.0.0.1:${port}/main.css?type=css`
          }, (err, res, body) => {
            if (err) {
              reject();
            }

            response = res;
            response.body = body;

            resolve();
          });
        });
      });

      it('should return a 200', function(done) {
        expect(response.statusCode).to.equal(200);

        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers['content-type']).to.equal('text/javascript');
        done();
      });

      // https://github.com/ProjectEvergreen/greenwood/issues/766
      // https://unpkg.com/browse/bootstrap@4.6.1/dist/css/bootstrap.css
      // https://unpkg.com/browse/font-awesome@4.7.0/css/font-awesome.css
      it('should return an ECMASCript module', function(done) {
        expect(response.body.replace('\n', '').replace(/ /g, '').trim())
          .to.equal('constcss=`*{background-image:url("/assets/background.jpg");font-family:\'Arial\'}.blockquote-footer::before{content:"\\\\2014\\\\00A0";}.fa-chevron-right:before{content:"\\\\f054";}`;exportdefaultcss;'); // eslint-disable-line max-len
        done();
      });
    });

    // https://github.com/ProjectEvergreen/greenwood/pull/747
    // https://unpkg.com/browse/@material/mwc-button@0.22.1/styles.css.js
    describe('Develop command specific ESM .css.js files behaviors (CSS in disguise)', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get({
            url: `http://127.0.0.1:${port}/styles.css.js`
          }, (err, res, body) => {
            if (err) {
              reject();
            }

            response = res;
            response.body = body;

            resolve();
          });
        });
      });

      it('should return a 200', function(done) {
        expect(response.statusCode).to.equal(200);

        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers['content-type']).to.equal('text/javascript');
        done();
      });

      it('should return an ECMASCript module', function(done) {
        expect(response.body).to.equal('export const styles = css `.mdc-touch-target-wrapper{display:inline}`;');
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