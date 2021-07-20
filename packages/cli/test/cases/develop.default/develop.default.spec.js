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
const http = require('http');

describe('Develop Greenwood With: ', function() {
  const LABEL = 'Default Greenwood Configuration and Workspace';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = __dirname;
  let runner;

  before(function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner();
  });

  describe(LABEL, function() {

    before(async function() {      
      return new Promise(async (resolve) => {
        setTimeout(() => {
          resolve();
        }, 3000);

        await runner.runCommand(cliPath, 'develop');
      });
    });

    it('should start the dev server at port 1984', function(done) {
      http.get('http://localhost:1984', function (res) {
        expect(res.statusCode).to.equal(200);
        done();
      });
    });
  });

  after(function() {
    runner.stopCommand();
  });
});