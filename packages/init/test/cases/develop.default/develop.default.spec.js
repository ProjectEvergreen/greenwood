/*
 * Use Case
 * Scaffold from minimal template and run Greenwood develop command with no config.
 *
 * User Result
 * Should scaffold from template and start the development server and render the template.
 *
 * User Command
 * @greenwood/init --install && greenwood develop
 *
 * User Workspace
 * N / A
 */
const expect = require('chai').expect;
const { JSDOM } = require('jsdom');
const path = require('path');
const { getSetupFiles } = require('../../../../../test/utils');
const request = require('request');
const Runner = require('gallinago').Runner;
const runSmokeTest = require('../../../../../test/smoke-test');

describe('Scaffold Greenwood With: ', function() {
  const initPath = path.join(process.cwd(), 'packages/init/src/index.js');
  const outputPath = path.join(__dirname, 'my-app');
  let runner;

  before(function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner();
  });

  describe('default minimal template', function () {

    before(async function() {
      await runner.setup(outputPath);
      await runner.runCommand(initPath, '--install');
    });

    describe('Develop Greenwood With: ', function() {
      const LABEL = 'Default Greenwood Configuration and Workspace';
      const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
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

          await runner.setup(outputPath, [
            ...getSetupFiles(outputPath)
          ]);

          return new Promise(async (resolve) => {
            setTimeout(() => {
              resolve();
            }, 5000);

            await runner.runCommand(cliPath, 'develop');
          });
        });

        runSmokeTest(['serve'], LABEL);

        describe('Develop command specific HTML behaviors', function() {
          let response = {};
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

          it('should display My Project heading', function(done) {
            const heading = dom.window.document.querySelector('body > h2');
            
            expect(heading.textContent).to.equal('My Project');

            done();
          });

          it('should display My Project title', function(done) {
            const title = dom.window.document.querySelector('head > title');
            
            expect(title.textContent).to.equal('My Project');

            done();
          });
        });

        after(function() {
          runner.stopCommand();
          runner.teardown([outputPath]);
        });
      });
    });
  });
});