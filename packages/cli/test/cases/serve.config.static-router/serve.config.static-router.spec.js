/*
 * Use Case
 * Run Greenwood with staticRouter setting in Greenwood to enable SPA like routing.
 *
 * User Result
 * Should serve a bare bones Greenwood build with support for static router navigation and SSR routes
 * to support hybrid workspaces.
 *
 * User Command
 * greenwood serve
 *
 * User Config
 * {
 *   staticRouter: true
 * }
 *
 * User Workspace
 * src/
 *   pages/
 *     about.md
 *     artists.js
 *     index.md
 */
import chai from 'chai';
import path from 'path';
import { getSetupFiles, getDependencyFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import request from 'request';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { Runner } from '../../../../../runner.js';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Serve Greenwood With: ', function() {
  const LABEL = 'Static Router Configuration and Hybrid Workspace';
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
      const greenwoodRouterLibs = await getDependencyFiles(
        `${process.cwd()}/packages/cli/src/lib/router.js`, 
        `${outputPath}/node_modules/@greenwood/cli/src/lib`
      );

      await runner.setup(outputPath, [
        ...getSetupFiles(outputPath),
        ...greenwoodRouterLibs
      ]);
      
      return new Promise(async (resolve) => {
        setTimeout(() => {
          resolve();
        }, 10000);

        await runner.runCommand(cliPath, 'serve');
      });
    });

    runSmokeTest(['serve'], LABEL);

    describe('Serve command with SSR route with staticRouter config set', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get(`${hostname}/artists/`, (err, res, body) => {
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
        expect(response.headers['content-type']).to.contain('text/html');
        done();
      });

      it('should return the correct response body', function(done) {
        expect(response.body).to.contain('<h2>Analog</h2>');
        expect(response.body).to.contain('<img src="/assets/analog.png" alt="Analog"/>');
        done();
      });
    });

  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
    runner.stopCommand();
  });
});