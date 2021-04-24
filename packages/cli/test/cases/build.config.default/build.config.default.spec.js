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
const { getSetupFiles, getOutputTeardownFiles } = require('../../../../../test/utils');
const Runner = require('gallinago').Runner;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Empty Configuration and Default Workspace';
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
      await runner.setup(outputPath, getSetupFiles(outputPath));
      await runner.runCommand(cliPath, 'build');
    });

    runSmokeTest(['public', 'index'], LABEL);
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});