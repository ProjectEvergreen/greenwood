/*
 * Use Case
 * Run Greenwood develop command with no config.
 *
 * User Result
 * Should start the development server and render a bare bones Greenwood build.
 *
 * User Command
 * greenwood develop
 *
 * User Config
 * None (Greenwood Default)
 *
 * User Workspace
 * Greenwood default (src/)
 */
const expect = require('chai').expect;
const path = require('path');
const Runner = require('gallinago').Runner;
const runSmokeTest = require('../../../../../test/smoke-test');
const http = require('http');

describe('Develop Greenwood With: ', function() {
  const LABEL = 'Default Greenwood Configuration and Workspace';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = __dirname;
  const url = 'http://localhost:1984';
  let runner;

  before(function() {
    this.context = {
      url
    };
    runner = new Runner();
  });

  describe(LABEL, function() {

    before(async function() {
      await runner.setup(outputPath);

      return new Promise(async (resolve) => {
        setTimeout(() => {
          resolve();
        }, 3000);

        await runner.runCommand(cliPath, 'develop');
      });
    });

    runSmokeTest(['serve'], LABEL);

    describe('Develop command specific behaviors', function() {
      let response = '';

      before(async function() {
        return new Promise((resolve, reject) => {
          http.get(url, res => {
            res.setEncoding('utf8');
            res.on('data', chunk => response += chunk);
            res.on('end', () => resolve(response));
          }).on('error', reject);
        });
      });

      //   <script type="importmap-shim">
      //   {
      //     "imports": {}
      //   }
      // </script>
      it('should return an import map in the <head> of the document', function(done) {
        // console.debug('response??????', response);
        expect(response).to.contain('<html');
        done();
      });

      // esmodule shims
      // <script defer src="https://unpkg.com/es-module-shims@0.5.2/dist/es-module-shims.js"></script>

      // livereload      
    });
  });

  after(function() {
    runner.stopCommand();
    runner.teardown([
      path.join(outputPath, '.greenwood')
    ]);
  });
});