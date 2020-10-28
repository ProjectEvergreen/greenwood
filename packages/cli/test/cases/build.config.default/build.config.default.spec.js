/*
 * Use Case
 * Run Greenwood with empty config object and default workspace.
 *
 * Uaer Result
 * Should generate a bare bones Greenwood build.  (same as build.default.spec.js)
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {}
 *
 * User Workspace
 * Greenwood default (src/)
 */
const path = require('path');
const runSmokeTest = require('../../../../../test/smoke-test');
const Runner = require('gallinago').Runner;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Empty Configuration and Default Workspace';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = path.join(__dirname, 'output');
  let runner;

  before(async function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner();
  });

  describe(LABEL, function() {
    before(async function() {
      await runner.setup(outputPath, [{
        source: path.join(process.cwd(), 'node_modules/@webcomponents/webcomponentsjs/webcomponents-bundle.js'),
        destination: path.join(outputPath, 'node_modules/@webcomponents/webcomponentsjs/webcomponents-bundle.js')
      }]);

      await runner.runCommand(cliPath, 'build');
    });

    runSmokeTest(['public', 'index'], LABEL);
  });

  after(function() {
    runner.teardown();
  });
});