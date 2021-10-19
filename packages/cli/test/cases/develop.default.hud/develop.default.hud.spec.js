/*
 * Use Case
 * Run Greenwood develop command with no config and invalid HTML in the <body> tag.
 *
 * User Result
 * Should start the development server and render a bare bones Greenwood build with message in the HUD (heads up display).
 *
 * User Command
 * greenwood develop
 *
 * User Config (default)
 *
 * User Workspace
 * src/
 *   pages/
 *     index.html
 */
const expect = require('chai').expect;
const fs = require('fs');
const { JSDOM } = require('jsdom');
const path = require('path');
const { getSetupFiles } = require('../../../../../test/utils');
const request = require('request');
const Runner = require('gallinago').Runner;
const runSmokeTest = require('../../../../../test/smoke-test');

describe('Develop Greenwood With: ', function() {
  const LABEL = 'Default Greenwood Configuration and Workspace';
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
      await runner.setup(outputPath, getSetupFiles(outputPath));

      return new Promise(async (resolve) => {
        setTimeout(() => {
          resolve();
        }, 5000);

        await runner.runCommand(cliPath, 'develop');
      });
    });

    runSmokeTest(['serve'], LABEL);

    describe('Develop command specific HUD HTML behaviors', function() {
      let response = {};
      let sourceHtml = '';
      let dom;

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get({
            url: `http://127.0.0.1:${port}`,
            headers: {
              accept: 'text/html'
            }
          }, (err, res, body) => {
            if (err) {
              reject();
            }

            response = res;
            
            dom = new JSDOM(body);
            sourceHtml = fs.readFileSync(path.join(__dirname, 'src/pages/index.html'), 'utf-8');

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

      it('should contain the appropriate HUD output in the response', function(done) {
        const body = dom.window.document.querySelectorAll('body')[0];

        expect(body.textContent).to.contain('Malformed HTML detected, please check your closing tags or an HTML formatter');
        expect(body.textContent.replace(/\\n/g, '').trim()).to.contain(sourceHtml.replace(/\\n/g, '').trim());

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