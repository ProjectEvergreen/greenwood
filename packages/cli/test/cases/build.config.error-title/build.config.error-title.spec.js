/*
 * Use Case
 * Run Greenwood build command with a bad value for title in a custom config.
 *
 * User Result
 * Should throw an error.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   title: {}
 * }
 *
 * User Workspace
 * Greenwood default
 */
const expect = require('chai').expect;
const path = require('path');
const { getSetupFiles } = require('../../../../../test/utils');
const Runner = require('gallinago').Runner;

describe('Build Greenwood With: ', function() {
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = path.join(__dirname, 'output');
  let runner;

  before(async function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner();
  });

  describe('Custom Configuration with a bad value for Title', function() {
    it('should throw an error that title must be a string', async function() {
      try {
        await runner.setup(outputPath, getSetupFiles(outputPath));
        await runner.runCommand(cliPath, 'build');
      } catch (err) {
        expect(err).to.contain('greenwood.config.js title must be a string');
      }
    });
  });

  after(function() {
    runner.teardown();
  });

});