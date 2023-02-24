/*
 * Use Case
 * Run Greenwood develop command with no config.
 *
 * User Result
 * Should start the development server and render a bare bones Greenwood build and return JSON file as ESM.
 *
 * User Command
 * greenwood develop
 *
 * User Config
 * const { greenwoodPluginImportJson } from '@greenwood/plugin-import-json';
 *
 * {
 *   plugins: [{
 *     greenwoodPluginImportJson()
 *   }]
 * }
 *
 *
 * User Workspace
 * src/
 *   main.json
 *
 */
import chai from 'chai';
import path from 'path';
import request from 'request';
import { Runner } from '../../../../../runner.js';
import { fileURLToPath, URL } from 'url';
import { runSmokeTest } from '../../../../../test/smoke-test.js';

const expect = chai.expect;

describe('Develop Greenwood With: ', function() {
  const LABEL = 'Import JSON plugin for using ESM with .json files';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
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

    describe('Develop command specific ESM .json behaviors', function() {
      let response = {};

      before(async function() {
        return new Promise((resolve, reject) => {
          request.get({
            url: `http://127.0.0.1:${port}/main.json?type=json`
          }, (err, res) => {
            if (err) {
              reject();
            }

            response = res;
            
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

      it('should return an ECMAScript module', function(done) {
        expect(response.body).to.equal('export default {"status":200,"message":"got json"}');
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