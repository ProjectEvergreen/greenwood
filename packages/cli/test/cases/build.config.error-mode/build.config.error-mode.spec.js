/*
 * Use Case
 * Run Greenwood build command with a bad value for mode in a custom config.
 *
 * User Result
 * Should throw an error.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   mode: 'lorumipsum'
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

  before(function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner();
  });

  describe('Custom Configuration with a bad value for mode', function() {
    it('should throw an error that provided mode is not valid', async function() {
      try {
        await runner.setup(outputPath, getSetupFiles(outputPath));
        await runner.runCommand(cliPath, 'build');
      } catch (err) {
        expect(err).to.contain('Error: provided mode "loremipsum" is not supported.  Please use one of: ssg, mpa.');
      }
    });
  });

  after(function() {
    runner.teardown();
  });

});