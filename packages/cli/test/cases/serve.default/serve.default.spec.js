/*
 * Use Case
 * Run Greenwood serve command with no config.
 *
 * User Result
 * Should start the production server and render a bare bones Greenwood build.
 *
 * User Command
 * greenwood serve
 *
 * User Config
 * None (Greenwood Default)
 *
 * User Workspace
 * Greenwood default (src/)
 */
// const expect = require('chai').expect;
const path = require('path');
const { getSetupFiles, getOutputTeardownFiles } = require('../../../../../test/utils');
const runSmokeTest = require('../../../../../test/smoke-test');
const Runner = require('gallinago').Runner;

describe('Serve Greenwood With: ', function() {
  const LABEL = 'Default Greenwood Configuration and Workspace';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = __dirname;
  const url = 'http://localhost:8080';
  let runner;

  before(function() {
    this.context = {
      url
    };
    runner = new Runner();
  });

  describe(LABEL, function() {

    before(async function() {
      await runner.setup(outputPath, getSetupFiles(outputPath));
      
      return new Promise(async (resolve) => {
        setTimeout(() => {
          resolve();
        }, 6000);

        await runner.runCommand(cliPath, 'serve');
      });
    });

    runSmokeTest(['serve'], LABEL);
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
    runner.stopCommand();
  });
});