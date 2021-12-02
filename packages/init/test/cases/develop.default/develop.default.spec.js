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
import chai from 'chai';
import fs from 'fs';
import { JSDOM } from 'jsdom';
import path from 'path';
import { getSetupFiles } from '../../../../../test/utils.js';
import request from 'request';
import { Runner } from 'gallinago';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

xdescribe('Scaffold Greenwood and Run Develop command: ', function() {
  const initPath = path.join(process.cwd(), 'packages/init/src/index.js');
  const outputPath = fileURLToPath(new URL('./my-app', import.meta.url));
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

        it('should generate a package-lock.json file', function() {
          expect(fs.existsSync(path.join(outputPath, 'package-lock.json'))).to.be.true;
        });
  
        it('should not generate a yarn.lock file', function() {
          expect(fs.existsSync(path.join(outputPath, 'yarn.lock'))).to.be.false;
        });

        it('should not generate a public directory', function() {
          expect(fs.existsSync(path.join(outputPath, 'public'))).to.be.false;
        });

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